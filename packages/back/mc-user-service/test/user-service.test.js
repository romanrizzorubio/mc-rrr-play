import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {loadUserServiceConfig} from '../src/config.js';
import {createSmtpMailer} from '../src/smtp-mailer.js';
import {createUserAuthService} from '../src/user-auth-service.js';
import {MongoUserStore} from '../src/user-store.js';
import {
    createUserServiceApp,
    PASSWORD_POLICY,
    SESSION_COOKIE,
    SESSION_COOKIE_PATH,
    USER_ROUTES,
} from '../src/index.js';

const frontendOrigin = 'https://localhost:8000';
const validPassword = 'OrionPass42!';
const replacementPassword = 'SecondPass84#';

const createMemoryStore = () => {
    const users = new Map();
    const sessions = new Map();
    const decks = new Map();
    let userSequence = 0;

    return {
        users,
        sessions,
        decks,
        async registerPendingUser(fields) {
            let user = users.get(fields.emailNormalized);
            if (user?.activatedAt) {
                return false;
            }

            if (!user) {
                user = {
                    _id: `user-${++userSequence}`,
                    email: fields.email,
                    emailNormalized: fields.emailNormalized,
                    isAdmin: false,
                    friendIds: [],
                    createdAt: fields.now,
                };
                users.set(fields.emailNormalized, user);
            }

            Object.assign(user, {
                displayName: fields.displayName,
                activationTokenHash: fields.activationTokenHash,
                activationExpiresAt: fields.activationExpiresAt,
                updatedAt: fields.now,
            });
            return true;
        },
        async getLoginUser(emailNormalized) {
            const user = users.get(emailNormalized);
            return user ? {...user} : null;
        },
        async getPendingActivationEmail(tokenHash, now) {
            const user = [...users.values()].find(record =>
                record.activationTokenHash === tokenHash &&
                record.activationExpiresAt > now &&
                !record.activatedAt &&
                !record.deletedAt
            );
            return user?.email || null;
        },
        async activateUser({tokenHash, passwordHash, now}) {
            const user = [...users.values()].find(record =>
                record.activationTokenHash === tokenHash &&
                record.activationExpiresAt > now &&
                !record.activatedAt &&
                !record.bannedAt &&
                !record.deletedAt
            );
            if (!user) {
                return false;
            }

            Object.assign(user, {
                passwordHash,
                activatedAt: now,
                updatedAt: now,
            });
            delete user.activationTokenHash;
            delete user.activationExpiresAt;
            return {...user};
        },
        async createPasswordResetToken({emailNormalized, tokenHash, resetExpiresAt, now}) {
            const user = users.get(emailNormalized);
            if (!user?.activatedAt) {
                return null;
            }

            Object.assign(user, {
                resetTokenHash: tokenHash,
                resetExpiresAt,
                updatedAt: now,
            });
            return {email: user.email, displayName: user.displayName};
        },
        async getPendingPasswordResetEmail(tokenHash, now) {
            const user = [...users.values()].find(record =>
                record.resetTokenHash === tokenHash &&
                record.resetExpiresAt > now &&
                record.activatedAt &&
                !record.deletedAt
            );
            return user?.email || null;
        },
        async completePasswordReset({tokenHash, passwordHash, now}) {
            const user = [...users.values()].find(record =>
                record.resetTokenHash === tokenHash &&
                record.resetExpiresAt > now &&
                record.activatedAt &&
                !record.deletedAt
            );
            if (!user) {
                return false;
            }

            Object.assign(user, {passwordHash, updatedAt: now});
            delete user.resetTokenHash;
            delete user.resetExpiresAt;
            for (const [sessionHash, session] of sessions) {
                if (session.userId === user._id) {
                    sessions.delete(sessionHash);
                }
            }
            return true;
        },
        async createSession(session) {
            sessions.set(session.tokenHash, session);
        },
        async getUserForSession(tokenHash, now) {
            const session = sessions.get(tokenHash);
            if (!session || session.expiresAt <= now) {
                return null;
            }

            const user = [...users.values()].find(record =>
                record._id === session.userId &&
                record.activatedAt &&
                !record.bannedAt &&
                !record.deletedAt
            );
            return user ? {
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                isAdmin: user.isAdmin,
            } : null;
        },
        async deleteSession(tokenHash) {
            sessions.delete(tokenHash);
        },
        async getUserPassword(userId) {
            const user = [...users.values()].find(record => record._id === userId);
            return user ? {passwordHash: user.passwordHash} : null;
        },
        async updatePassword({userId, passwordHash, preserveSessionTokenHash, now}) {
            const user = [...users.values()].find(record => record._id === userId);
            if (!user) {
                return false;
            }

            Object.assign(user, {passwordHash, updatedAt: now});
            delete user.resetTokenHash;
            delete user.resetExpiresAt;
            for (const [sessionHash, session] of sessions) {
                if (session.userId === userId && sessionHash !== preserveSessionTokenHash) {
                    sessions.delete(sessionHash);
                }
            }
            return true;
        },
        async updateDisplayName({userId, displayName, now}) {
            const user = [...users.values()].find(record => record._id === userId);
            if (!user) {
                return null;
            }

            Object.assign(user, {displayName, updatedAt: now});
            return {
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                isAdmin: user.isAdmin,
            };
        },
        async getFriends(userId) {
            const owner = [...users.values()].find(user => user._id === userId);
            if (!owner || owner.deletedAt) {
                return null;
            }

            return (owner.friendIds || []).flatMap(friendId => {
                const friend = [...users.values()].find(user =>
                    user._id === friendId &&
                    user.activatedAt &&
                    !user.deletedAt
                );
                return friend ? [{
                    id: friend._id,
                    name: friend.displayName,
                    email: friend.email,
                    isFriendOf: (friend.friendIds || []).includes(userId),
                }] : [];
            });
        },
        async searchUsers({userId, query}) {
            const owner = [...users.values()].find(user =>
                user._id === userId && !user.deletedAt
            );
            if (!owner) {
                return null;
            }

            const normalizedQuery = query.toLowerCase();
            return [...users.values()]
                .filter(user =>
                    user._id !== userId &&
                    user.activatedAt &&
                    !user.bannedAt &&
                    !user.deletedAt &&
                    `${user.displayName} ${user.email}`
                        .toLowerCase()
                        .includes(normalizedQuery)
                )
                .slice(0, 50)
                .map(user => ({
                    id: user._id,
                    name: user.displayName,
                    email: user.email,
                    isFriend: (owner.friendIds || []).includes(user._id),
                }));
        },
        async addFriend({userId, friendId, now}) {
            const owner = [...users.values()].find(user =>
                user._id === userId && !user.deletedAt
            );
            const friend = [...users.values()].find(user =>
                user._id === friendId &&
                user.activatedAt &&
                !user.bannedAt &&
                !user.deletedAt
            );
            if (!owner || !friend || userId === friendId) {
                return false;
            }

            owner.friendIds ??= [];
            if (!owner.friendIds.includes(friendId)) {
                owner.friendIds.push(friendId);
            }
            owner.updatedAt = now;
            return true;
        },
        async removeFriend({userId, friendId, now}) {
            const owner = [...users.values()].find(user =>
                user._id === userId && !user.deletedAt
            );
            if (!owner) {
                return false;
            }

            owner.friendIds = (owner.friendIds || []).filter(id => id !== friendId);
            owner.updatedAt = now;
            return true;
        },
        async getAdminUsers() {
            return [...users.values()].map(user => ({...user}));
        },
        async getAdminUser(userId) {
            const user = [...users.values()].find(record => record._id === userId);
            return user ? {...user} : null;
        },
        async promoteAdminByEmail({emailNormalized, now}) {
            const user = users.get(emailNormalized);
            if (!user || user.deletedAt) {
                return false;
            }

            Object.assign(user, {isAdmin: true, updatedAt: now});
            return true;
        },
        async updateAdminStatus({userId, isAdmin, now}) {
            const user = [...users.values()].find(record =>
                record._id === userId && !record.deletedAt
            );
            if (!user) {
                return null;
            }

            Object.assign(user, {isAdmin, updatedAt: now});
            return {...user};
        },
        async banUser({userId, now}) {
            const user = [...users.values()].find(record =>
                record._id === userId && !record.bannedAt && !record.deletedAt
            );
            if (!user) {
                return null;
            }

            Object.assign(user, {bannedAt: now, updatedAt: now});
            for (const [tokenHash, session] of sessions) {
                if (session.userId === userId) {
                    sessions.delete(tokenHash);
                }
            }
            return {...user};
        },
        async unbanUser({userId, now}) {
            const user = [...users.values()].find(record =>
                record._id === userId && record.bannedAt && !record.deletedAt
            );
            if (!user) {
                return null;
            }

            delete user.bannedAt;
            user.updatedAt = now;
            return {...user};
        },
        async softDeleteUser({userId, now}) {
            const user = [...users.values()].find(record =>
                record._id === userId && !record.deletedAt
            );
            if (!user) {
                return null;
            }

            Object.assign(user, {deletedAt: now, updatedAt: now});
            delete user.resetTokenHash;
            delete user.resetExpiresAt;
            for (const [tokenHash, session] of sessions) {
                if (session.userId === userId) {
                    sessions.delete(tokenHash);
                }
            }
            return {...user};
        },
        async restoreUser({userId, now}) {
            const user = [...users.values()].find(record =>
                record._id === userId && record.deletedAt
            );
            if (!user) {
                return null;
            }

            delete user.deletedAt;
            user.updatedAt = now;
            return {...user};
        },
        async permanentlyDeleteUser({userId, now}) {
            const user = [...users.values()].find(record =>
                record._id === userId && record.deletedAt
            );
            if (!user) {
                return null;
            }

            const deckIds = [];
            for (const [deckId, deck] of decks) {
                if (deck.creatorId !== userId) {
                    continue;
                }

                deckIds.push(deckId);
                Object.assign(deck, {deletedAt: now.toISOString()});
                delete deck.name;
                delete deck.cards;
                delete deck.creatorId;
            }
            for (const record of users.values()) {
                record.friendIds = (record.friendIds || []).filter(id =>
                    id !== userId
                );
                if (Array.isArray(record.favoriteDeckIds)) {
                    record.favoriteDeckIds = record.favoriteDeckIds.filter(id =>
                        !deckIds.includes(id)
                    );
                }
            }
            for (const [tokenHash, session] of sessions) {
                if (session.userId === userId) {
                    sessions.delete(tokenHash);
                }
            }
            users.delete(user.emailNormalized);
            return {...user};
        },
    };
};

const listen = async app => {
    const server = await new Promise((resolve, reject) => {
        const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
        listener.once('error', reject);
    });

    return {
        url: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        }),
    };
};

const createTestService = () => {
    const store = createMemoryStore();
    const messages = [];
    const mailer = {
        send: async message => {
            messages.push(message);
        },
    };
    const auth = createUserAuthService({
        store,
        mailer,
        frontendOrigin,
    });

    return {
        store,
        messages,
        auth,
        app: createUserServiceApp({
            store,
            mailer,
            frontendOrigin,
        }),
    };
};

const sendJson = (url, route, body, options = {}) => fetch(`${url}${route}`, {
    method: options.method || 'POST',
    headers: {
        'Content-Type': 'application/json',
        ...(options.cookie ? {Cookie: options.cookie} : {}),
        ...(options.origin ? {Origin: options.origin} : {}),
    },
    ...(body === undefined ? {} : {body: JSON.stringify(body)}),
});

const tokenFromMessage = message => {
    const link = message.text.split('\n').find(line => line.startsWith('http'));
    return new URL(link).searchParams.get('token');
};

const registerAndActivate = async (service, url, email = 'player@example.com') => {
    const registration = await sendJson(url, USER_ROUTES.register, {
        email,
        name: 'Player One',
    });
    assert.equal(registration.status, 202);

    const token = tokenFromMessage(service.messages.at(-1));
    const activation = await sendJson(url, USER_ROUTES.activate, {
        token,
        password: validPassword,
    });
    assert.equal(activation.status, 200);

    return activation.headers.get('set-cookie').split(';', 1)[0];
};

describe('mc-user-service', () => {
    test('registers pending accounts, activates them, and manages opaque sessions', async () => {
        const service = createTestService();
        const http = await listen(service.app);

        try {
            const registration = await sendJson(http.url, USER_ROUTES.register, {
                email: '  Player@Example.com ',
                name: '  Player One ',
            }, {origin: frontendOrigin});
            const user = service.store.users.get('player@example.com');
            const activationToken = tokenFromMessage(service.messages[0]);

            assert.equal(registration.status, 202);
            assert.match(
                registration.headers.get('access-control-allow-origin'),
                /localhost:8000/u,
            );
            assert.equal(registration.headers.get('access-control-allow-credentials'), 'true');
            assert.equal(user.email, 'Player@Example.com');
            assert.equal(user.displayName, 'Player One');
            assert.equal(user.passwordHash, undefined);
            assert.notEqual(user.activationTokenHash, activationToken);
            const activationPreview = await fetch(
                `${http.url}${USER_ROUTES.activationPreview}?token=${encodeURIComponent(activationToken)}`,
            );
            assert.equal(activationPreview.status, 200);
            assert.deepEqual(await activationPreview.json(), {
                email: 'Player@Example.com',
            });
            const unauthenticatedMe = await fetch(`${http.url}${USER_ROUTES.me}`);
            assert.equal(unauthenticatedMe.status, 401);
            assert.equal(
                JSON.stringify(await registration.json()).includes(activationToken),
                false,
            );
            assert.match(service.messages[0].text, /\/activate\?token=/u);

            const blockedLogin = await sendJson(http.url, USER_ROUTES.login, {
                email: 'player@example.com',
                password: validPassword,
            });
            assert.equal(blockedLogin.status, 401);
            assert.equal((await blockedLogin.json()).error.message, 'El correo o la contraseña no son válidos.');

            const activation = await sendJson(http.url, USER_ROUTES.activate, {
                token: activationToken,
                password: validPassword,
            });
            assert.equal(activation.status, 200);
            assert.deepEqual(await activation.json(), {
                activated: true,
                authenticated: true,
                user: {
                    id: user._id,
                    email: 'Player@Example.com',
                    name: 'Player One',
                    isAdmin: false,
                },
            });
            const activationCookie = activation.headers.get('set-cookie')
                .split(';', 1)[0];
            assert.equal(
                (await fetch(`${http.url}${USER_ROUTES.me}`, {
                    headers: {Cookie: activationCookie},
                })).status,
                200,
            );
            assert.match(user.passwordHash, /^scrypt\$/u);
            assert.equal(user.passwordHash.includes(validPassword), false);
            assert.equal(user.activationTokenHash, undefined);
            const consumedActivationPreview = await fetch(
                `${http.url}${USER_ROUTES.activationPreview}?token=${encodeURIComponent(activationToken)}`,
            );
            assert.equal(consumedActivationPreview.status, 400);

            const existingMailCount = service.messages.length;
            const duplicateRegistration = await sendJson(http.url, USER_ROUTES.register, {
                email: 'player@example.com',
                name: 'Another Name',
            });
            assert.equal(duplicateRegistration.status, 202);
            assert.equal(service.messages.length, existingMailCount);
            assert.equal(service.store.users.size, 1);

            const usedActivation = await sendJson(http.url, USER_ROUTES.activate, {
                token: activationToken,
                password: replacementPassword,
            });
            assert.equal(usedActivation.status, 400);

            const login = await sendJson(http.url, USER_ROUTES.login, {
                email: 'PLAYER@example.com',
                password: validPassword,
            });
            const loginBody = await login.json();
            const cookieHeader = login.headers.get('set-cookie');
            const cookie = cookieHeader.split(';', 1)[0];

            assert.equal(login.status, 200);
            assert.deepEqual(loginBody, {
                authenticated: true,
                user: {
                    id: user._id,
                    email: 'Player@Example.com',
                    name: 'Player One',
                    isAdmin: false,
                },
            });
            assert.match(cookieHeader, /HttpOnly/u);
            assert.match(cookieHeader, /SameSite=Lax/u);
            assert.match(cookieHeader, new RegExp(`Path=${SESSION_COOKIE_PATH};`, 'u'));
            assert.equal(cookie.startsWith(`${SESSION_COOKIE}=`), true);
            assert.equal(JSON.stringify(loginBody).includes(user.passwordHash), false);
            assert.equal([...service.store.sessions.values()][0].tokenHash === cookie.split('=')[1], false);

            const wrongPassword = await sendJson(http.url, USER_ROUTES.login, {
                email: 'player@example.com',
                password: replacementPassword,
            });
            const unknownUser = await sendJson(http.url, USER_ROUTES.login, {
                email: 'unknown@example.com',
                password: validPassword,
            });
            assert.equal(wrongPassword.status, 401);
            assert.equal(unknownUser.status, 401);
            assert.deepEqual(await wrongPassword.json(), await unknownUser.json());

            const me = await fetch(`${http.url}${USER_ROUTES.me}`, {
                headers: {Cookie: cookie},
            });
            assert.equal(me.status, 200);
            assert.deepEqual(await me.json(), {
                user: {
                    id: user._id,
                    email: 'Player@Example.com',
                    name: 'Player One',
                    isAdmin: false,
                },
            });

            assert.equal((await fetch(`${http.url}${USER_ROUTES.health}`)).status, 200);
        } finally {
            await http.close();
        }
    });

    test('uses the persisted administrator field to authorize user management', async () => {
        const service = createTestService();
        const http = await listen(service.app);

        try {
            const adminCookie = await registerAndActivate(
                service,
                http.url,
                'admin@example.com',
            );
            const admin = service.store.users.get('admin@example.com');
            admin.isAdmin = true;
            const userCookie = await registerAndActivate(service, http.url);

            const session = await fetch(`${http.url}${USER_ROUTES.me}`, {
                headers: {Cookie: adminCookie},
            });
            const sessionBody = await session.json();
            assert.equal(session.status, 200);
            assert.equal(sessionBody.user.isAdmin, true);

            const users = await fetch(`${http.url}${USER_ROUTES.users}`, {
                headers: {Cookie: adminCookie},
            });
            assert.equal(users.status, 200);
            assert.equal((await users.json()).users.length, 2);

            const protectedRequests = [
                [USER_ROUTES.users, 'GET'],
                [USER_ROUTES.user.replace(':id', admin._id), 'GET'],
                [USER_ROUTES.userPasswordReset.replace(':id', admin._id), 'POST'],
                [USER_ROUTES.userBan.replace(':id', admin._id), 'POST'],
                [USER_ROUTES.userUnban.replace(':id', admin._id), 'POST'],
                [USER_ROUTES.userRestore.replace(':id', admin._id), 'POST'],
                [USER_ROUTES.user.replace(':id', admin._id), 'PATCH'],
                [USER_ROUTES.user.replace(':id', admin._id), 'DELETE'],
                [USER_ROUTES.userPermanentDelete.replace(':id', admin._id), 'DELETE'],
            ];
            for (const [route, method] of protectedRequests) {
                const denied = await sendJson(
                    http.url,
                    route,
                    method === 'PATCH' ? {isAdmin: true} : undefined,
                    {method, cookie: userCookie},
                );
                assert.equal(denied.status, 403, `${method} ${route}`);
            }

            const selfUpdate = await sendJson(
                http.url,
                USER_ROUTES.user.replace(':id', admin._id),
                {isAdmin: false},
                {method: 'PATCH', cookie: adminCookie},
            );
            assert.equal(selfUpdate.status, 403);
        } finally {
            await http.close();
        }
    });

    test('supports asymmetric friendships and authenticated user search', async () => {
        const service = createTestService();
        const http = await listen(service.app);

        try {
            const aliceCookie = await registerAndActivate(
                service,
                http.url,
                'alice@example.com',
            );
            const alice = service.store.users.get('alice@example.com');
            const bobCookie = await registerAndActivate(
                service,
                http.url,
                'bob@example.com',
            );
            const bob = service.store.users.get('bob@example.com');
            const searchEndpoint = `${USER_ROUTES.userSearch}?query=${
                encodeURIComponent('bob@example.com')
            }`;

            const unauthenticatedSearch = await fetch(
                `${http.url}${searchEndpoint}`,
            );
            assert.equal(unauthenticatedSearch.status, 401);

            const search = await fetch(`${http.url}${searchEndpoint}`, {
                headers: {Cookie: aliceCookie},
            });
            assert.equal(search.status, 200);
            assert.deepEqual((await search.json()).users, [{
                id: bob._id,
                name: 'Player One',
                email: 'bob@example.com',
                isFriend: false,
            }]);

            const addedByAlice = await sendJson(
                http.url,
                USER_ROUTES.friend.replace(':id', bob._id),
                undefined,
                {cookie: aliceCookie},
            );
            assert.equal(addedByAlice.status, 200);
            assert.deepEqual((await addedByAlice.json()).friends, [{
                id: bob._id,
                name: 'Player One',
                email: 'bob@example.com',
                isFriendOf: false,
            }]);

            const bobFriendsBeforeAdding = await fetch(
                `${http.url}${USER_ROUTES.friends}`,
                {headers: {Cookie: bobCookie}},
            );
            assert.deepEqual((await bobFriendsBeforeAdding.json()).friends, []);

            const bobAddsAlice = await sendJson(
                http.url,
                USER_ROUTES.friend.replace(':id', alice._id),
                undefined,
                {cookie: bobCookie},
            );
            assert.equal(bobAddsAlice.status, 200);
            assert.equal((await bobAddsAlice.json()).friends[0].isFriendOf, true);

            const bobRemovesAlice = await fetch(
                `${http.url}${USER_ROUTES.friend.replace(':id', alice._id)}`,
                {method: 'DELETE', headers: {Cookie: bobCookie}},
            );
            assert.equal(bobRemovesAlice.status, 200);
            assert.deepEqual((await bobRemovesAlice.json()).friends, []);

            const aliceFriendsAfterRemoval = await fetch(
                `${http.url}${USER_ROUTES.friends}`,
                {headers: {Cookie: aliceCookie}},
            );
            assert.equal(
                (await aliceFriendsAfterRemoval.json()).friends[0].isFriendOf,
                false,
            );

            const aliceRemovesBob = await fetch(
                `${http.url}${USER_ROUTES.friend.replace(':id', bob._id)}`,
                {method: 'DELETE', headers: {Cookie: aliceCookie}},
            );
            assert.deepEqual((await aliceRemovesBob.json()).friends, []);

            const selfAdd = await sendJson(
                http.url,
                USER_ROUTES.friend.replace(':id', alice._id),
                undefined,
                {cookie: aliceCookie},
            );
            assert.equal(selfAdd.status, 400);
        } finally {
            await http.close();
        }
    });

    test('prevents deleting the last administrator through either delete path', async () => {
        const service = createTestService();
        const http = await listen(service.app);

        try {
            const adminCookie = await registerAndActivate(
                service,
                http.url,
                'admin@example.com',
            );
            const admin = service.store.users.get('admin@example.com');
            admin.isAdmin = true;

            const logicalDelete = await fetch(
                `${http.url}${USER_ROUTES.user.replace(':id', admin._id)}`,
                {method: 'DELETE', headers: {Cookie: adminCookie}},
            );
            assert.equal(logicalDelete.status, 409);

            admin.deletedAt = new Date();
            await assert.rejects(
                service.auth.permanentlyDeleteUser(admin._id),
                error => error.statusCode === 409,
            );
            assert.equal(service.store.users.has('admin@example.com'), true);
        } finally {
            await http.close();
        }
    });

    test('manages account status, sends reset links, and permanently removes owned decks', async () => {
        const service = createTestService();
        const http = await listen(service.app);

        try {
            const adminCookie = await registerAndActivate(
                service,
                http.url,
                'admin@example.com',
            );
            const admin = service.store.users.get('admin@example.com');
            admin.isAdmin = true;
            const targetCookie = await registerAndActivate(service, http.url);
            const target = service.store.users.get('player@example.com');
            target.favoriteDeckIds = ['owned-deck'];
            const userPath = USER_ROUTES.user.replace(':id', target._id);

            const prematurePermanentDelete = await fetch(
                `${http.url}${USER_ROUTES.userPermanentDelete.replace(':id', target._id)}`,
                {
                    method: 'DELETE',
                    headers: {Cookie: adminCookie},
                },
            );
            assert.equal(prematurePermanentDelete.status, 409);

            const userCannotBan = await sendJson(
                http.url,
                USER_ROUTES.userBan.replace(':id', target._id),
                undefined,
                {cookie: targetCookie},
            );
            assert.equal(userCannotBan.status, 403);

            const reset = await sendJson(
                http.url,
                USER_ROUTES.userPasswordReset.replace(':id', target._id),
                undefined,
                {cookie: adminCookie},
            );
            assert.equal(reset.status, 202);
            assert.equal(service.messages.at(-1).to, target.email);

            const banned = await sendJson(
                http.url,
                USER_ROUTES.userBan.replace(':id', target._id),
                undefined,
                {cookie: adminCookie},
            );
            assert.equal(banned.status, 200);
            assert.equal((await banned.json()).user.isBanned, true);
            assert.equal(
                (await fetch(`${http.url}${USER_ROUTES.me}`, {
                    headers: {Cookie: targetCookie},
                })).status,
                401,
            );
            assert.equal(
                (await sendJson(http.url, USER_ROUTES.login, {
                    email: target.email,
                    password: validPassword,
                })).status,
                401,
            );

            const unbanned = await sendJson(
                http.url,
                USER_ROUTES.userUnban.replace(':id', target._id),
                undefined,
                {cookie: adminCookie},
            );
            assert.equal((await unbanned.json()).user.isBanned, false);
            const restoredLogin = await sendJson(http.url, USER_ROUTES.login, {
                email: target.email,
                password: validPassword,
            });
            const restoredCookie = restoredLogin.headers.get('set-cookie').split(';', 1)[0];

            const roleChange = await sendJson(
                http.url,
                userPath,
                {isAdmin: true},
                {method: 'PATCH', cookie: adminCookie},
            );
            assert.equal((await roleChange.json()).user.isAdmin, true);
            assert.equal(target.isAdmin, true);
            const roleChangeBack = await sendJson(
                http.url,
                userPath,
                {isAdmin: false},
                {method: 'PATCH', cookie: adminCookie},
            );
            assert.equal((await roleChangeBack.json()).user.isAdmin, false);

            const lastAdminBan = await sendJson(
                http.url,
                USER_ROUTES.userBan.replace(':id', admin._id),
                undefined,
                {cookie: adminCookie},
            );
            assert.equal(lastAdminBan.status, 403);
            const selfUnban = await sendJson(
                http.url,
                USER_ROUTES.userUnban.replace(':id', admin._id),
                undefined,
                {cookie: adminCookie},
            );
            assert.equal(selfUnban.status, 403);

            service.store.decks.set('owned-deck', {
                _id: 'owned-deck',
                creatorId: target._id,
                name: 'Owned deck',
                cards: [{id: 'card-1', count: 1}],
            });
            const softDeleted = await fetch(`${http.url}${userPath}`, {
                method: 'DELETE',
                headers: {Cookie: adminCookie},
            });
            assert.equal((await softDeleted.json()).user.isDeleted, true);
            assert.equal(
                (await fetch(`${http.url}${USER_ROUTES.me}`, {
                    headers: {Cookie: restoredCookie},
                })).status,
                401,
            );

            const restored = await sendJson(
                http.url,
                USER_ROUTES.userRestore.replace(':id', target._id),
                undefined,
                {cookie: adminCookie},
            );
            assert.equal((await restored.json()).user.isDeleted, false);

            await fetch(`${http.url}${userPath}`, {
                method: 'DELETE',
                headers: {Cookie: adminCookie},
            });
            const permanentDelete = await fetch(
                `${http.url}${USER_ROUTES.userPermanentDelete.replace(':id', target._id)}`,
                {
                    method: 'DELETE',
                    headers: {Cookie: adminCookie},
                },
            );
            assert.equal(permanentDelete.status, 200);
            assert.deepEqual(await permanentDelete.json(), {deleted: true});
            assert.equal(service.store.users.has('player@example.com'), false);
            assert.equal(typeof service.store.decks.get('owned-deck').deletedAt, 'string');
            assert.equal(service.store.decks.get('owned-deck').name, undefined);
        } finally {
            await http.close();
        }
    });

    test('keeps password-reset responses generic, consumes reset tokens, and invalidates sessions', async () => {
        const service = createTestService();
        const http = await listen(service.app);

        try {
            await registerAndActivate(service, http.url);
            const login = await sendJson(http.url, USER_ROUTES.login, {
                email: 'player@example.com',
                password: validPassword,
            });
            const cookie = login.headers.get('set-cookie').split(';', 1)[0];

            const unknownEmail = await sendJson(
                http.url,
                USER_ROUTES.passwordResetRequest,
                {email: 'unknown@example.com'},
            );
            const existingEmail = await sendJson(
                http.url,
                USER_ROUTES.passwordResetRequest,
                {email: 'PLAYER@example.com'},
            );
            const unknownBody = await unknownEmail.json();
            const existingBody = await existingEmail.json();
            const resetToken = tokenFromMessage(service.messages.at(-1));
            const user = service.store.users.get('player@example.com');

            assert.equal(unknownEmail.status, 202);
            assert.equal(existingEmail.status, 202);
            assert.deepEqual(unknownBody, existingBody);
            assert.notEqual(user.resetTokenHash, resetToken);
            assert.match(service.messages.at(-1).text, /\/reset-password\?token=/u);
            const resetPreview = await fetch(
                `${http.url}${USER_ROUTES.passwordReset}?token=${encodeURIComponent(resetToken)}`,
            );
            assert.equal(resetPreview.status, 200);
            assert.deepEqual(await resetPreview.json(), {
                email: 'player@example.com',
            });

            const reset = await sendJson(http.url, USER_ROUTES.passwordReset, {
                token: resetToken,
                password: replacementPassword,
            });
            assert.equal(reset.status, 200);
            assert.deepEqual(await reset.json(), {passwordChanged: true});
            assert.equal(user.resetTokenHash, undefined);
            assert.equal(service.store.sessions.size, 0);
            const consumedResetPreview = await fetch(
                `${http.url}${USER_ROUTES.passwordReset}?token=${encodeURIComponent(resetToken)}`,
            );
            assert.equal(consumedResetPreview.status, 400);

            const reusedToken = await sendJson(http.url, USER_ROUTES.passwordReset, {
                token: resetToken,
                password: validPassword,
            });
            assert.equal(reusedToken.status, 400);

            const oldLogin = await sendJson(http.url, USER_ROUTES.login, {
                email: 'player@example.com',
                password: validPassword,
            });
            const newLogin = await sendJson(http.url, USER_ROUTES.login, {
                email: 'player@example.com',
                password: replacementPassword,
            });
            const staleSession = await fetch(`${http.url}${USER_ROUTES.me}`, {
                headers: {Cookie: cookie},
            });

            assert.equal(oldLogin.status, 401);
            assert.equal(newLogin.status, 200);
            assert.equal(staleSession.status, 401);
        } finally {
            await http.close();
        }
    });

    test('updates visual profile names and changes passwords without changing email identity', async () => {
        const service = createTestService();
        const http = await listen(service.app);

        try {
            await registerAndActivate(service, http.url);
            const login = await sendJson(http.url, USER_ROUTES.login, {
                email: 'player@example.com',
                password: validPassword,
            });
            const cookie = login.headers.get('set-cookie').split(';', 1)[0];

            const unauthenticatedProfile = await sendJson(
                http.url,
                USER_ROUTES.profile,
                undefined,
                {method: 'GET'},
            );
            assert.equal(unauthenticatedProfile.status, 401);

            const updateProfile = await sendJson(http.url, USER_ROUTES.profile, {
                name: 'New Display Name',
                email: 'changed@example.com',
            }, {method: 'PATCH', cookie});
            assert.deepEqual(await updateProfile.json(), {
                user: {
                    id: service.store.users.get('player@example.com')._id,
                    email: 'player@example.com',
                    name: 'New Display Name',
                    isAdmin: false,
                },
            });
            await sendJson(http.url, USER_ROUTES.passwordResetRequest, {
                email: 'player@example.com',
            });
            const outstandingResetToken = tokenFromMessage(service.messages.at(-1));

            const wrongPassword = await sendJson(http.url, USER_ROUTES.passwordChange, {
                currentPassword: 'WrongCurrent42!',
                newPassword: replacementPassword,
            }, {cookie});
            assert.equal(wrongPassword.status, 401);

            const updatePassword = await sendJson(http.url, USER_ROUTES.passwordChange, {
                currentPassword: validPassword,
                newPassword: replacementPassword,
            }, {cookie});
            assert.equal(updatePassword.status, 200);
            assert.deepEqual(await updatePassword.json(), {passwordChanged: true});
            assert.equal(service.store.sessions.size, 1);
            assert.equal(
                service.store.users.get('player@example.com').resetTokenHash,
                undefined,
            );
            const invalidatedReset = await sendJson(
                http.url,
                USER_ROUTES.passwordReset,
                {
                    token: outstandingResetToken,
                    password: validPassword,
                },
            );
            assert.equal(invalidatedReset.status, 400);

            const profile = await sendJson(
                http.url,
                USER_ROUTES.profile,
                undefined,
                {method: 'GET', cookie},
            );
            assert.deepEqual(await profile.json(), {
                user: {
                    id: service.store.users.get('player@example.com')._id,
                    email: 'player@example.com',
                    name: 'New Display Name',
                    isAdmin: false,
                },
            });

            const oldPasswordLogin = await sendJson(http.url, USER_ROUTES.login, {
                email: 'player@example.com',
                password: validPassword,
            });
            const newPasswordLogin = await sendJson(http.url, USER_ROUTES.login, {
                email: 'player@example.com',
                password: replacementPassword,
            });
            assert.equal(oldPasswordLogin.status, 401);
            assert.equal(newPasswordLogin.status, 200);

            const logout = await sendJson(
                http.url,
                USER_ROUTES.logout,
                undefined,
                {cookie},
            );
            assert.equal(logout.status, 204);
            assert.match(logout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/u);
            const afterLogout = await fetch(`${http.url}${USER_ROUTES.me}`, {
                headers: {Cookie: cookie},
            });
            assert.equal(afterLogout.status, 401);
        } finally {
            await http.close();
        }
    });

    test('validates input, requires explicit SMTP configuration, and exposes Mongo indexes', async () => {
        const service = createTestService();
        const http = await listen(service.app);

        try {
            assert.deepEqual({
                register: USER_ROUTES.register,
                login: USER_ROUTES.login,
                logout: USER_ROUTES.logout,
                me: USER_ROUTES.me,
                activate: USER_ROUTES.activate,
                activationPreview: USER_ROUTES.activationPreview,
                passwordResetRequest: USER_ROUTES.passwordResetRequest,
                passwordReset: USER_ROUTES.passwordReset,
                profile: USER_ROUTES.profile,
                passwordChange: USER_ROUTES.passwordChange,
                users: USER_ROUTES.users,
                user: USER_ROUTES.user,
            }, {
                register: '/register',
                login: '/login',
                logout: '/logout',
                me: '/me',
                activate: '/activate',
                activationPreview: '/activation',
                passwordResetRequest: '/password-reset/request',
                passwordReset: '/password-reset',
                profile: '/profile',
                passwordChange: '/password/change',
                users: '/users',
                user: '/users/:id',
            });

            assert.equal(PASSWORD_POLICY.minLength, 10);
            assert.equal(PASSWORD_POLICY.maxLength, 128);
            assert.equal(PASSWORD_POLICY.lengthUnit, 'UTF-16 code units (JavaScript String.length)');
            assert.equal(PASSWORD_POLICY.requiredCharacterClasses, 3);
            assert.deepEqual(
                PASSWORD_POLICY.characterClasses.map(({name}) => name),
                [
                    'unicodeLowercaseLetter',
                    'unicodeUppercaseLetter',
                    'unicodeNumber',
                    'nonLetterAndNonNumber',
                ],
            );
            assert.equal(PASSWORD_POLICY.trimsWhitespace, false);

            const invalidPassword = await sendJson(http.url, USER_ROUTES.register, {
                email: 'valid@example.com',
                name: 'Name',
            });
            assert.equal(invalidPassword.status, 202);
            const activationToken = tokenFromMessage(service.messages[0]);
            const weakPassword = await sendJson(http.url, USER_ROUTES.activate, {
                token: activationToken,
                password: 'lowercaseonly',
            });
            assert.equal(weakPassword.status, 400);

            const invalidEmail = await sendJson(http.url, USER_ROUTES.register, {
                email: 'not-an-email',
                name: 'Name',
            });
            assert.equal(invalidEmail.status, 400);

            const unconfiguredMailer = createSmtpMailer({});
            assert.throws(
                () => unconfiguredMailer.assertConfigured(),
                error => error.statusCode === 503 &&
                    error.message.includes('SMTP_HOST'),
            );
            assert.throws(
                () => loadUserServiceConfig({}),
                /FRONTEND_ORIGIN must be configured/u,
            );
            const config = loadUserServiceConfig({
                PORT: '3456',
                MONGODB_URI: 'mongodb://mongo.example:27017',
                MONGODB_DATABASE: 'mc-users',
                SMTP_HOST: 'smtp.example.com',
                SMTP_PORT: '587',
                SMTP_USER: 'mailer',
                SMTP_PASSWORD: 'test-only-password',
                SMTP_FROM: 'MC RRR Play <noreply@example.com>',
                FRONTEND_ORIGIN: 'https://play.example.com/',
                NODE_ENV: 'production',
            });
            assert.equal(config.port, 3456);
            assert.equal(config.mongoUri, 'mongodb://mongo.example:27017');
            assert.equal(config.mongoDatabase, 'mc-users');
            assert.equal(config.frontendOrigin, 'https://play.example.com');
            assert.equal(config.smtp.host, 'smtp.example.com');
            assert.equal(config.secureCookies, true);
            assert.equal(typeof createSmtpMailer(config.smtp).send, 'function');

            const localHttpsConfig = loadUserServiceConfig({
                FRONTEND_ORIGIN: frontendOrigin,
                SESSION_COOKIE_SECURE: 'true',
            });
            assert.equal(localHttpsConfig.secureCookies, true);
            assert.equal(loadUserServiceConfig({
                FRONTEND_ORIGIN: frontendOrigin,
            }).secureCookies, true);
            assert.throws(
                () => loadUserServiceConfig({
                    FRONTEND_ORIGIN: frontendOrigin,
                    SESSION_COOKIE_SECURE: 'yes',
                }),
                /SESSION_COOKIE_SECURE must be true or false/u,
            );

            let localSmtpOptions;
            let sentMail;
            const localMailer = createSmtpMailer({
                host: 'mailpit',
                port: '1025',
                user: '',
                password: '',
                from: 'MC RRR Play <noreply@example.com>',
                transportFactory: options => {
                    localSmtpOptions = options;
                    return {
                        sendMail: async message => {
                            sentMail = message;
                        },
                    };
                },
            });
            await localMailer.send({
                to: 'player@example.com',
                subject: 'Test',
                text: 'Test message',
            });
            assert.deepEqual(localSmtpOptions, {
                host: 'mailpit',
                port: 1025,
                secure: false,
                requireTLS: false,
            });
            assert.deepEqual(sentMail, {
                from: 'MC RRR Play <noreply@example.com>',
                to: 'player@example.com',
                subject: 'Test',
                text: 'Test message',
            });
            assert.throws(
                () => createSmtpMailer({
                    host: 'mailpit',
                    port: '1025',
                    user: 'mailer',
                    password: '',
                    from: 'noreply@example.com',
                }).assertConfigured(),
                /deben configurarse juntos/u,
            );

            const indexes = [];
            const fakeCollections = new Map();
            const store = new MongoUserStore({
                uri: 'mongodb://localhost:27017',
                database: 'users-test',
                clientFactory: () => ({
                    connect: async () => {},
                    db: () => ({
                        collection: name => {
                            if (!fakeCollections.has(name)) {
                                fakeCollections.set(name, {
                                    createIndex: async (keys, options) => {
                                        indexes.push({collection: name, keys, options});
                                    },
                                    updateMany: async () => ({modifiedCount: 0}),
                                });
                            }
                            return fakeCollections.get(name);
                        },
                    }),
                    close: async () => {},
                }),
            });
            await store.connect();
            await store.close();

            assert.ok(indexes.some(index =>
                index.collection === 'users' &&
                index.keys.emailNormalized === 1 &&
                index.options.unique === true
            ));
            assert.ok(indexes.some(index =>
                index.collection === 'users' &&
                index.keys.activationTokenHash === 1 &&
                index.options.unique === true
            ));
            assert.ok(indexes.some(index =>
                index.collection === 'users' &&
                index.keys.resetTokenHash === 1 &&
                index.options.unique === true
            ));
            assert.ok(indexes.some(index =>
                index.collection === 'userSessions' &&
                index.keys.tokenHash === 1 &&
                index.options.unique === true
            ));
            assert.ok(indexes.some(index =>
                index.collection === 'userSessions' &&
                index.keys.expiresAt === 1 &&
                index.options.expireAfterSeconds === 0
            ));
        } finally {
            await http.close();
        }
    });

    test('persists administrator roles and removes owned decks as repository tombstones', async () => {
        const now = new Date('2026-04-01T00:00:00.000Z');
        const users = [
            {
                _id: 'admin-1',
                emailNormalized: 'admin@example.com',
                favoriteDeckIds: ['owned-deck', 'other-deck'],
                friendIds: ['owner-1'],
            },
            {
                _id: 'owner-1',
                emailNormalized: 'owner@example.com',
                deletedAt: new Date('2026-03-20T00:00:00.000Z'),
            },
        ];
        const decks = [{
            _id: 'owned-deck',
            creatorId: 'owner-1',
            name: 'Owned deck',
            heroId: 'hero',
            aspect: 'justice',
            cards: [{id: 'card-1', count: 1}],
            createdAt: '2026-03-01T00:00:00.000Z',
            updatedAt: '2026-03-10T00:00:00.000Z',
        }];
        const sessions = [{userId: 'owner-1'}];
        const userCollection = {
            createIndex: async () => {},
            find: () => ({
                sort() {
                    return this;
                },
                toArray: async () => users.map(user => ({...user})),
            }),
            findOne: async filter =>
                users.find(user => user._id === filter._id) ?
                    {...users.find(user => user._id === filter._id)} :
                    null,
            updateOne: async (filter, update) => {
                const user = users.find(record =>
                    record.emailNormalized === filter.emailNormalized &&
                    !record.deletedAt
                );
                if (!user) {
                    return {matchedCount: 0};
                }

                Object.assign(user, update.$set);
                return {matchedCount: 1};
            },
            updateMany: async (_filter, update) => {
                if (update.$set?.isAdmin === false) {
                    users.filter(user => user.isAdmin === undefined)
                        .forEach(user => { user.isAdmin = false; });
                    return {modifiedCount: 1};
                }

                if (update.$pull?.favoriteDeckIds) {
                    for (const user of users) {
                        if (!user.favoriteDeckIds?.some(id =>
                            update.$pull.favoriteDeckIds.$in.includes(id)
                        )) {
                            continue;
                        }
                        user.favoriteDeckIds = user.favoriteDeckIds.filter(id =>
                            !update.$pull.favoriteDeckIds.$in.includes(id)
                        );
                    }
                } else if (update.$pull?.friendIds) {
                    for (const user of users) {
                        user.friendIds = (user.friendIds || []).filter(id =>
                            id !== update.$pull.friendIds
                        );
                    }
                }
                return {modifiedCount: 1};
            },
            deleteOne: async filter => {
                const userIndex = users.findIndex(user =>
                    user._id === filter._id && user.deletedAt
                );
                if (userIndex === -1) {
                    return {deletedCount: 0};
                }

                users.splice(userIndex, 1);
                return {deletedCount: 1};
            },
        };
        const deckCollection = {
            find: filter => ({
                toArray: async () => decks
                    .filter(deck => deck.creatorId === filter.creatorId)
                    .map(deck => ({...deck})),
            }),
            updateOne: async (filter, update) => {
                const deck = decks.find(record =>
                    record._id === filter._id &&
                    record.creatorId === filter.creatorId
                );
                if (!deck) {
                    return {matchedCount: 0};
                }

                Object.assign(deck, update.$set);
                Object.keys(update.$unset).forEach(key => delete deck[key]);
                return {matchedCount: 1};
            },
        };
        const sessionCollection = {
            createIndex: async () => {},
            deleteMany: async filter => {
                const matching = sessions.filter(session =>
                    session.userId === filter.userId
                );
                matching.forEach(session => sessions.splice(
                    sessions.indexOf(session),
                    1,
                ));
            },
        };
        const database = {
            collection(name) {
                return {
                    users: userCollection,
                    decks: deckCollection,
                    userSessions: sessionCollection,
                }[name];
            },
        };
        const store = new MongoUserStore({
            clientFactory: () => ({
                connect: async () => {},
                db: () => database,
                close: async () => {},
            }),
        });

        await store.connect();
        try {
            assert.equal(await store.promoteAdminByEmail({
                emailNormalized: 'admin@example.com',
                now,
            }), true);
            assert.equal(users[0].isAdmin, true);

            const deleted = await store.permanentlyDeleteUser({
                userId: 'owner-1',
                now,
            });
            assert.equal(deleted._id, 'owner-1');
            assert.deepEqual(decks[0], {
                _id: 'owned-deck',
                creatorId: 'owner-1',
                deletedAt: now.toISOString(),
            });
            assert.deepEqual(users[0].favoriteDeckIds, ['other-deck']);
            assert.deepEqual(users[0].friendIds, []);
            assert.deepEqual(users.map(({_id}) => _id), ['admin-1']);
            assert.deepEqual(sessions, []);
        } finally {
            await store.close();
        }
    });

    test('starts without SMTP settings but returns explicit 503 for email operations', async () => {
        const config = loadUserServiceConfig({
            FRONTEND_ORIGIN: frontendOrigin,
        });
        const app = createUserServiceApp({
            store: createMemoryStore(),
            mailer: createSmtpMailer(config.smtp),
            frontendOrigin: config.frontendOrigin,
        });
        const http = await listen(app);

        try {
            const health = await fetch(`${http.url}${USER_ROUTES.health}`);
            assert.equal(health.status, 200);
            assert.deepEqual(await health.json(), {status: 'ok'});

            const registration = await sendJson(http.url, USER_ROUTES.register, {
                email: 'player@example.com',
                name: 'Player One',
            });
            const resetRequest = await sendJson(
                http.url,
                USER_ROUTES.passwordResetRequest,
                {email: 'player@example.com'},
            );
            const registrationBody = await registration.json();
            const resetBody = await resetRequest.json();

            assert.equal(registration.status, 503);
            assert.deepEqual(registrationBody, {
                error: {
                    message: registrationBody.error.message,
                    status: 503,
                },
            });
            assert.match(registrationBody.error.message, /SMTP_HOST/u);
            assert.equal(resetRequest.status, 503);
            assert.deepEqual(resetBody, {
                error: {
                    message: resetBody.error.message,
                    status: 503,
                },
            });
            assert.match(resetBody.error.message, /SMTP_HOST/u);
        } finally {
            await http.close();
        }
    });
});
