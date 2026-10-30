import {randomUUID} from 'node:crypto';
import {MongoClient} from 'mongodb';

const sessionCollectionName = 'userSessions';
const userCollectionName = 'users';
const userSearchLimit = 50;

export class MongoUserStore {
    static escapeSearchText(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    }

    constructor({
        uri = process.env.MONGODB_URI || 'mongodb://localhost:27017',
        database = process.env.MONGODB_DATABASE || 'mc',
        clientFactory = connectionString => new MongoClient(connectionString),
    } = {}) {
        this.uri = uri;
        this.databaseName = database;
        this.clientFactory = clientFactory;
        this.client = null;
        this.database = null;
        this.users = null;
        this.sessions = null;
        this.decks = null;
    }

    async connect() {
        this.client = this.clientFactory(this.uri);
        await this.client.connect();
        this.database = this.client.db(this.databaseName);
        this.users = this.database.collection(userCollectionName);
        this.sessions = this.database.collection(sessionCollectionName);
        this.decks = this.database.collection('decks');

        await Promise.all([
            this.users.createIndex(
                {emailNormalized: 1},
                {unique: true, name: 'unique_normalized_user_email'},
            ),
            this.users.createIndex(
                {activationTokenHash: 1},
                {unique: true, sparse: true, name: 'unique_activation_token_hash'},
            ),
            this.users.createIndex(
                {resetTokenHash: 1},
                {unique: true, sparse: true, name: 'unique_reset_token_hash'},
            ),
            this.sessions.createIndex(
                {tokenHash: 1},
                {unique: true, name: 'unique_session_token_hash'},
            ),
            this.sessions.createIndex(
                {expiresAt: 1},
                {expireAfterSeconds: 0, name: 'expire_user_sessions'},
            ),
            this.sessions.createIndex(
                {userId: 1},
                {name: 'sessions_by_user'},
            ),
        ]);
        await this.users.updateMany(
            {isAdmin: {$exists: false}},
            {$set: {isAdmin: false}},
        );
    }

    async close() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.database = null;
            this.users = null;
            this.sessions = null;
            this.decks = null;
        }
    }

    async registerPendingUser({
        email,
        emailNormalized,
        displayName,
        activationTokenHash,
        activationExpiresAt,
        now,
    }) {
        try {
            const user = await this.users.findOneAndUpdate(
                {emailNormalized, activatedAt: {$exists: false}},
                {
                    $set: {
                        displayName,
                        activationTokenHash,
                        activationExpiresAt,
                        updatedAt: now,
                    },
                    $setOnInsert: {
                        _id: randomUUID(),
                        email,
                        emailNormalized,
                        isAdmin: false,
                        friendIds: [],
                        createdAt: now,
                    },
                },
                {
                    upsert: true,
                    returnDocument: 'after',
                    projection: {_id: 1},
                },
            );

            return Boolean(user);
        } catch (error) {
            if (error.code === 11000) {
                return false;
            }

            throw error;
        }
    }

    getLoginUser(emailNormalized) {
        return this.users.findOne(
            {emailNormalized},
            {
                projection: {
                    _id: 1,
                    email: 1,
                    displayName: 1,
                    passwordHash: 1,
                    activatedAt: 1,
                    isAdmin: 1,
                    bannedAt: 1,
                    deletedAt: 1,
                    emailNormalized: 1,
                },
            },
        );
    }

    async getPendingActivationEmail(tokenHash, now) {
        const user = await this.users.findOne(
            {
                activationTokenHash: tokenHash,
                activationExpiresAt: {$gt: now},
                activatedAt: {$exists: false},
                deletedAt: {$exists: false},
            },
            {projection: {_id: 0, email: 1}},
        );

        return user?.email || null;
    }

    async activateUser({tokenHash, passwordHash, now}) {
        const user = await this.users.findOneAndUpdate(
            {
                activationTokenHash: tokenHash,
                activationExpiresAt: {$gt: now},
                activatedAt: {$exists: false},
                bannedAt: {$exists: false},
                deletedAt: {$exists: false},
            },
            {
                $set: {
                    passwordHash,
                    activatedAt: now,
                    updatedAt: now,
                },
                $unset: {
                    activationTokenHash: '',
                    activationExpiresAt: '',
                    resetTokenHash: '',
                    resetExpiresAt: '',
                },
            },
            {
                returnDocument: 'after',
                projection: {
                    _id: 1,
                    email: 1,
                    displayName: 1,
                    emailNormalized: 1,
                    isAdmin: 1,
                },
            },
        );

        return user;
    }

    createPasswordResetToken({emailNormalized, tokenHash, resetExpiresAt, now}) {
        return this.users.findOneAndUpdate(
            {
                emailNormalized,
                activatedAt: {$exists: true},
                deletedAt: {$exists: false},
            },
            {
                $set: {
                    resetTokenHash: tokenHash,
                    resetExpiresAt,
                    updatedAt: now,
                },
            },
            {
                returnDocument: 'after',
                projection: {email: 1, displayName: 1},
            },
        );
    }

    async getPendingPasswordResetEmail(tokenHash, now) {
        const user = await this.users.findOne(
            {
                resetTokenHash: tokenHash,
                resetExpiresAt: {$gt: now},
                activatedAt: {$exists: true},
                deletedAt: {$exists: false},
            },
            {projection: {_id: 0, email: 1}},
        );

        return user?.email || null;
    }

    async completePasswordReset({tokenHash, passwordHash, now}) {
        const user = await this.users.findOneAndUpdate(
            {
                resetTokenHash: tokenHash,
                resetExpiresAt: {$gt: now},
                activatedAt: {$exists: true},
                deletedAt: {$exists: false},
            },
            {
                $set: {
                    passwordHash,
                    updatedAt: now,
                },
                $unset: {
                    resetTokenHash: '',
                    resetExpiresAt: '',
                },
            },
            {
                returnDocument: 'after',
                projection: {_id: 1},
            },
        );
        if (!user) {
            return false;
        }

        await this.sessions.deleteMany({userId: user._id});

        return true;
    }

    async createSession({userId, tokenHash, expiresAt, createdAt}) {
        await this.sessions.insertOne({
            _id: randomUUID(),
            userId,
            tokenHash,
            expiresAt,
            createdAt,
        });
    }

    async getUserForSession(tokenHash, now) {
        const session = await this.sessions.findOne(
            {tokenHash, expiresAt: {$gt: now}},
            {projection: {userId: 1}},
        );
        if (!session) {
            return null;
        }

        const user = await this.users.findOne(
            {
                _id: session.userId,
                activatedAt: {$exists: true},
                bannedAt: {$exists: false},
                deletedAt: {$exists: false},
            },
            {
                projection: {
                    email: 1,
                    emailNormalized: 1,
                    displayName: 1,
                    isAdmin: 1,
                },
            },
        );
        return user ? {
            id: user._id,
            email: user.email,
            displayName: user.displayName,
            emailNormalized: user.emailNormalized,
            isAdmin: user.isAdmin,
        } : null;
    }

    deleteSession(tokenHash) {
        return this.sessions.deleteOne({tokenHash});
    }

    getUserPassword(userId) {
        return this.users.findOne(
            {
                _id: userId,
                activatedAt: {$exists: true},
                bannedAt: {$exists: false},
                deletedAt: {$exists: false},
            },
            {projection: {passwordHash: 1}},
        );
    }

    async updatePassword({userId, passwordHash, preserveSessionTokenHash, now}) {
        const result = await this.users.updateOne(
            {
                _id: userId,
                activatedAt: {$exists: true},
                bannedAt: {$exists: false},
                deletedAt: {$exists: false},
            },
            {
                $set: {passwordHash, updatedAt: now},
                $unset: {
                    resetTokenHash: '',
                    resetExpiresAt: '',
                },
            },
        );
        if (result.modifiedCount !== 1) {
            return false;
        }

        await this.sessions.deleteMany({
            userId,
            tokenHash: {$ne: preserveSessionTokenHash},
        });

        return true;
    }

    updateDisplayName({userId, displayName, now}) {
        return this.users.findOneAndUpdate(
            {
                _id: userId,
                activatedAt: {$exists: true},
                bannedAt: {$exists: false},
                deletedAt: {$exists: false},
            },
            {$set: {displayName, updatedAt: now}},
            {
                returnDocument: 'after',
                projection: {
                    email: 1,
                    emailNormalized: 1,
                    displayName: 1,
                    isAdmin: 1,
                },
            },
        ).then(user => user ? {
            id: user._id,
            email: user.email,
            displayName: user.displayName,
            emailNormalized: user.emailNormalized,
            isAdmin: user.isAdmin,
        } : null);
    }

    async getFriends(userId) {
        const owner = await this.users.findOne(
            {_id: userId, deletedAt: {$exists: false}},
            {projection: {friendIds: 1}},
        );
        if (!owner) {
            return null;
        }

        const friendIds = [...new Set(
            Array.isArray(owner.friendIds) ?
                owner.friendIds.filter(id =>
                    typeof id === 'string' && id !== userId
                ) :
                [],
        )];
        if (!friendIds.length) {
            return [];
        }

        const friends = await this.users.find(
            {
                _id: {$in: friendIds},
                activatedAt: {$exists: true},
                deletedAt: {$exists: false},
            },
            {projection: {_id: 1, email: 1, displayName: 1, friendIds: 1}},
        ).toArray();
        const friendsById = new Map(friends.map(friend => [friend._id, friend]));

        return friendIds.flatMap(id => {
            const friend = friendsById.get(id);
            return friend ? [{
                id: friend._id,
                name: friend.displayName,
                email: friend.email,
                isFriendOf: Array.isArray(friend.friendIds) &&
                    friend.friendIds.includes(userId),
            }] : [];
        });
    }

    async searchUsers({userId, query}) {
        const owner = await this.users.findOne(
            {_id: userId, deletedAt: {$exists: false}},
            {projection: {friendIds: 1}},
        );
        if (!owner) {
            return null;
        }

        const searchExpression = new RegExp(
            MongoUserStore.escapeSearchText(query),
            'iu',
        );
        const matches = await this.users.find(
            {
                _id: {$ne: userId},
                activatedAt: {$exists: true},
                bannedAt: {$exists: false},
                deletedAt: {$exists: false},
                $or: [
                    {displayName: searchExpression},
                    {email: searchExpression},
                ],
            },
            {
                projection: {
                    _id: 1,
                    email: 1,
                    displayName: 1,
                },
            },
        ).sort({displayName: 1, emailNormalized: 1})
            .limit(userSearchLimit)
            .toArray();
        const friendIds = new Set(
            Array.isArray(owner.friendIds) ? owner.friendIds : [],
        );

        return matches.map(user => ({
            id: user._id,
            name: user.displayName,
            email: user.email,
            isFriend: friendIds.has(user._id),
        }));
    }

    async addFriend({userId, friendId, now}) {
        if (userId === friendId) {
            return false;
        }

        const friend = await this.users.findOne(
            {
                _id: friendId,
                activatedAt: {$exists: true},
                bannedAt: {$exists: false},
                deletedAt: {$exists: false},
            },
            {projection: {_id: 1}},
        );
        if (!friend) {
            return false;
        }

        const result = await this.users.updateOne(
            {_id: userId, deletedAt: {$exists: false}},
            {
                $addToSet: {friendIds: friendId},
                $set: {updatedAt: now},
            },
        );

        return result.matchedCount === 1;
    }

    async removeFriend({userId, friendId, now}) {
        const result = await this.users.updateOne(
            {_id: userId, deletedAt: {$exists: false}},
            {
                $pull: {friendIds: friendId},
                $set: {updatedAt: now},
            },
        );

        return result.matchedCount === 1;
    }

    async getAdminUsers() {
        return this.users.find(
            {},
            {
                projection: {
                    _id: 1,
                    email: 1,
                    emailNormalized: 1,
                    displayName: 1,
                    activatedAt: 1,
                    isAdmin: 1,
                    bannedAt: 1,
                    deletedAt: 1,
                },
            },
        ).sort({emailNormalized: 1}).toArray();
    }

    async promoteAdminByEmail({emailNormalized, now}) {
        const result = await this.users.updateOne(
            {
                emailNormalized,
                deletedAt: {$exists: false},
            },
            {$set: {isAdmin: true, updatedAt: now}},
        );

        return result.matchedCount === 1;
    }

    getAdminUser(userId) {
        return this.users.findOne(
            {_id: userId},
            {
                projection: {
                    _id: 1,
                    email: 1,
                    emailNormalized: 1,
                    displayName: 1,
                    activatedAt: 1,
                    isAdmin: 1,
                    bannedAt: 1,
                    deletedAt: 1,
                },
            },
        );
    }

    updateAdminStatus({userId, isAdmin, now}) {
        return this.users.findOneAndUpdate(
            {
                _id: userId,
                deletedAt: {$exists: false},
            },
            {$set: {isAdmin, updatedAt: now}},
            {
                returnDocument: 'after',
                projection: {
                    _id: 1,
                    email: 1,
                    emailNormalized: 1,
                    displayName: 1,
                    activatedAt: 1,
                    isAdmin: 1,
                    bannedAt: 1,
                    deletedAt: 1,
                },
            },
        );
    }

    async banUser({userId, now}) {
        const user = await this.users.findOneAndUpdate(
            {
                _id: userId,
                bannedAt: {$exists: false},
                deletedAt: {$exists: false},
            },
            {$set: {bannedAt: now, updatedAt: now}},
            {
                returnDocument: 'after',
                projection: {
                    _id: 1,
                    email: 1,
                    emailNormalized: 1,
                    displayName: 1,
                    activatedAt: 1,
                    isAdmin: 1,
                    bannedAt: 1,
                    deletedAt: 1,
                },
            },
        );
        if (user) {
            await this.sessions.deleteMany({userId});
        }

        return user;
    }

    unbanUser({userId, now}) {
        return this.users.findOneAndUpdate(
            {
                _id: userId,
                bannedAt: {$exists: true},
                deletedAt: {$exists: false},
            },
            {
                $set: {updatedAt: now},
                $unset: {bannedAt: ''},
            },
            {
                returnDocument: 'after',
                projection: {
                    _id: 1,
                    email: 1,
                    emailNormalized: 1,
                    displayName: 1,
                    activatedAt: 1,
                    isAdmin: 1,
                    bannedAt: 1,
                    deletedAt: 1,
                },
            },
        );
    }

    async softDeleteUser({userId, now}) {
        const user = await this.users.findOneAndUpdate(
            {
                _id: userId,
                deletedAt: {$exists: false},
            },
            {
                $set: {deletedAt: now, updatedAt: now},
                $unset: {
                    resetTokenHash: '',
                    resetExpiresAt: '',
                },
            },
            {
                returnDocument: 'after',
                projection: {
                    _id: 1,
                    email: 1,
                    emailNormalized: 1,
                    displayName: 1,
                    activatedAt: 1,
                    isAdmin: 1,
                    bannedAt: 1,
                    deletedAt: 1,
                },
            },
        );
        if (user) {
            await this.sessions.deleteMany({userId});
        }

        return user;
    }

    restoreUser({userId, now}) {
        return this.users.findOneAndUpdate(
            {
                _id: userId,
                deletedAt: {$exists: true},
            },
            {
                $set: {updatedAt: now},
                $unset: {deletedAt: ''},
            },
            {
                returnDocument: 'after',
                projection: {
                    _id: 1,
                    email: 1,
                    emailNormalized: 1,
                    displayName: 1,
                    activatedAt: 1,
                    isAdmin: 1,
                    bannedAt: 1,
                    deletedAt: 1,
                },
            },
        );
    }

    async permanentlyDeleteUser({userId, now}) {
        const user = await this.getAdminUser(userId);
        if (!user?.deletedAt) {
            return null;
        }

        const ownedDecks = await this.decks.find(
            {creatorId: userId},
            {projection: {_id: 1, updatedAt: 1, deletedAt: 1}},
        ).toArray();
        const deckIds = ownedDecks.map(deck => deck._id);
        for (const deck of ownedDecks) {
            const updatedAt = deck.updatedAt === undefined ?
                Number.NaN :
                Date.parse(deck.updatedAt);
            const deletedAt = deck.deletedAt === undefined ?
                Number.NaN :
                Date.parse(deck.deletedAt);
            if (deck.updatedAt !== undefined && !Number.isFinite(updatedAt)) {
                throw new Error(`El mazo "${deck._id}" tiene una fecha de actualización inválida.`);
            }
            if (deck.deletedAt !== undefined && !Number.isFinite(deletedAt)) {
                throw new Error(`El mazo "${deck._id}" tiene una fecha de borrado inválida.`);
            }

            const deletionTime = Math.max(
                now.getTime(),
                Number.isFinite(updatedAt) ? updatedAt + 1 : 0,
                Number.isFinite(deletedAt) ? deletedAt + 1 : 0,
            );
            // Keep the owner reference for retries; the newer tombstone blocks restores.
            await this.decks.updateOne(
                {_id: deck._id, creatorId: userId},
                {
                    $set: {deletedAt: new Date(deletionTime).toISOString()},
                    $unset: {
                        name: '',
                        heroId: '',
                        aspect: '',
                        aspects: '',
                        cards: '',
                        createdAt: '',
                        updatedAt: '',
                    },
                },
            );
        }

        if (deckIds.length) {
            await this.users.updateMany(
                {favoriteDeckIds: {$in: deckIds}},
                {$pull: {favoriteDeckIds: {$in: deckIds}}},
            );
        }
        await this.users.updateMany(
            {friendIds: userId},
            {$pull: {friendIds: userId}},
        );
        await this.sessions.deleteMany({userId});
        const result = await this.users.deleteOne({
            _id: userId,
            deletedAt: {$exists: true},
        });

        return result.deletedCount === 1 ? user : null;
    }
}
