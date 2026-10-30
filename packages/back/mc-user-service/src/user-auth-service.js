import {
    createOpaqueToken,
    createServiceError,
    hashOpaqueToken,
    hashPassword,
    validateDisplayName,
    validateEmail,
    validatePassword,
    verifyPassword,
} from './utils/auth-utils.js';

export const SESSION_COOKIE = 'mc_user_session';
export const SESSION_COOKIE_PATH = '/';
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
export const USER_LINK_PATHS = Object.freeze({
    activation: '/activate',
    passwordReset: '/reset-password',
});

const activationDurationMs = 24 * 60 * 60 * 1000;
const resetDurationMs = 60 * 60 * 1000;
const maxUserSearchLength = 100;
const genericLoginError = 'El correo o la contraseña no son válidos.';
export const RESET_REQUEST_MESSAGE =
    'Si existe una cuenta activada con ese correo, recibirás un enlace para restablecer la contraseña.';
const dummyPasswordHash =
    `scrypt$00112233445566778899aabbccddeeff$${'0'.repeat(128)}`;

class UserAuthService {
    constructor({
        store,
        mailer,
        frontendOrigin,
        clock = () => new Date(),
    }) {
        if (!store || !mailer || typeof mailer.send !== 'function') {
            throw new TypeError('A user store and configured mailer are required.');
        }

        this.store = store;
        this.mailer = mailer;
        this.frontendOrigin = frontendOrigin;
        this.clock = clock;
    }

    _now() {
        return new Date(this.clock());
    }

    _isAdmin(user) {
        return user.isAdmin === true;
    }

    _withAdminStatus(user) {
        return {
            ...user,
            isAdmin: this._isAdmin(user),
        };
    }

    _formatAdminUser(user) {
        return {
            id: user._id,
            name: user.displayName,
            email: user.email,
            isActivated: Boolean(user.activatedAt),
            isAdmin: this._isAdmin(user),
            isBanned: Boolean(user.bannedAt),
            isDeleted: Boolean(user.deletedAt),
        };
    }

    async _getAdminUser(userId) {
        if (typeof userId !== 'string' || !userId.trim()) {
            throw createServiceError('El identificador de usuario no es válido.', 400);
        }

        const user = await this.store.getAdminUser(userId);
        if (!user) {
            throw createServiceError('No se encontró el usuario solicitado.', 404);
        }

        return user;
    }

    async _assertAnotherActiveAdminRemains(user) {
        if (!this._isAdmin(user) || user.bannedAt || user.deletedAt) {
            return;
        }

        const users = await this.store.getAdminUsers();
        const activeAdmins = users.filter(record =>
            !record.bannedAt &&
            !record.deletedAt &&
            this._isAdmin(record)
        );
        if (activeAdmins.length <= 1) {
            throw createServiceError(
                'No se puede desactivar al último administrador disponible.',
                409,
            );
        }
    }

    async _assertAdminCanBeDeleted(user) {
        if (!this._isAdmin(user)) {
            return;
        }

        const users = await this.store.getAdminUsers();
        const admins = users.filter(record => this._isAdmin(record));
        if (admins.length <= 1) {
            throw createServiceError(
                'No se puede eliminar al último administrador.',
                409,
            );
        }
    }

    async register(body) {
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            throw createServiceError('La solicitud de registro no es válida.', 400);
        }

        const email = typeof body.email === 'string' ? body.email.trim() : body.email;
        const emailNormalized = validateEmail(email);
        const displayName = validateDisplayName(body.name);
        await this.mailer.assertConfigured?.();
        const token = createOpaqueToken();
        const now = this._now();
        const registered = await this.store.registerPendingUser({
            email,
            emailNormalized,
            displayName,
            activationTokenHash: hashOpaqueToken(token),
            activationExpiresAt: new Date(now.getTime() + activationDurationMs),
            now,
        });

        if (!registered) {
            return;
        }

        const activationLink = new URL(USER_LINK_PATHS.activation, this.frontendOrigin);
        activationLink.searchParams.set('token', token);
        await this.mailer.send({
            to: email,
            subject: 'Activa tu cuenta de MC RRR Play',
            text: `Hola ${displayName}:\n\nActiva tu cuenta y elige una contraseña en este enlace:\n${activationLink}\n\nEl enlace caduca en 24 horas.`,
        });
    }

    async login(body) {
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            throw createServiceError('La solicitud de inicio de sesión no es válida.', 400);
        }
        if (typeof body.password !== 'string' || body.password.length === 0) {
            throw createServiceError(genericLoginError, 401);
        }

        const emailNormalized = validateEmail(body.email);
        const user = await this.store.getLoginUser(emailNormalized);
        const validPassword = await verifyPassword(
            body.password,
            user?.passwordHash || dummyPasswordHash,
        );
        if (!user || !user.activatedAt || user.bannedAt || user.deletedAt ||
            !validPassword) {
            throw createServiceError(genericLoginError, 401);
        }

        const token = createOpaqueToken();
        const now = this._now();
        const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
        await this.store.createSession({
            userId: user._id,
            tokenHash: hashOpaqueToken(token),
            expiresAt,
            createdAt: now,
        });

        return {
            token,
            expiresAt,
            user: this._withAdminStatus({
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                isAdmin: user.isAdmin,
            }),
        };
    }

    async getPendingActivationEmail(token) {
        if (typeof token !== 'string' || !token) {
            throw createServiceError('El enlace de activación no es válido.', 400);
        }

        const email = await this.store.getPendingActivationEmail(
            hashOpaqueToken(token),
            this._now(),
        );
        if (!email) {
            throw createServiceError('El enlace de activación no es válido o ha caducado.', 400);
        }

        return email;
    }

    async activate(body) {
        if (!body || typeof body !== 'object' || Array.isArray(body) ||
            typeof body.token !== 'string' || !body.token) {
            throw createServiceError('El enlace de activación no es válido.', 400);
        }

        const password = validatePassword(body.password);
        const now = this._now();
        const activated = await this.store.activateUser({
            tokenHash: hashOpaqueToken(body.token),
            passwordHash: await hashPassword(password),
            now,
        });
        if (!activated) {
            throw createServiceError('El enlace de activación no es válido o ha caducado.', 400);
        }

        const token = createOpaqueToken();
        const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
        await this.store.createSession({
            userId: activated._id,
            tokenHash: hashOpaqueToken(token),
            expiresAt,
            createdAt: now,
        });

        return {
            token,
            expiresAt,
            user: this._withAdminStatus({
                id: activated._id,
                email: activated.email,
                displayName: activated.displayName,
                isAdmin: activated.isAdmin,
            }),
        };
    }

    async requestPasswordReset(body) {
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            throw createServiceError('La solicitud de recuperación no es válida.', 400);
        }

        const emailNormalized = validateEmail(body.email);
        await this._sendPasswordReset(emailNormalized);
    }

    async _sendPasswordReset(emailNormalized) {
        await this.mailer.assertConfigured?.();
        const token = createOpaqueToken();
        const now = this._now();
        const user = await this.store.createPasswordResetToken({
            emailNormalized,
            tokenHash: hashOpaqueToken(token),
            resetExpiresAt: new Date(now.getTime() + resetDurationMs),
            now,
        });
        if (!user) {
            return;
        }

        const resetLink = new URL(USER_LINK_PATHS.passwordReset, this.frontendOrigin);
        resetLink.searchParams.set('token', token);
        await this.mailer.send({
            to: user.email,
            subject: 'Restablece tu contraseña de MC RRR Play',
            text: `Hola ${user.displayName}:\n\nElige una nueva contraseña en este enlace:\n${resetLink}\n\nEl enlace caduca en una hora. Si no solicitaste el cambio, ignora este correo.`,
        });
    }

    async getAdminUsers() {
        const users = await this.store.getAdminUsers();

        return users.map(user => this._formatAdminUser(user));
    }

    async getAdminUser(userId) {
        return this._formatAdminUser(await this._getAdminUser(userId));
    }

    async getFriends(userId) {
        const friends = await this.store.getFriends(userId);
        if (!friends) {
            throw createServiceError('No se encontró la cuenta.', 404);
        }

        return friends;
    }

    async searchUsers(userId, query) {
        if (typeof query !== 'string' ||
            !query.trim() ||
            query.trim().length > maxUserSearchLength) {
            throw createServiceError(
                'Introduce un nombre o email de hasta 100 caracteres.',
                400,
            );
        }

        const users = await this.store.searchUsers({
            userId,
            query: query.trim(),
        });
        if (!users) {
            throw createServiceError('No se encontró la cuenta.', 404);
        }

        return users;
    }

    async addFriend(userId, friendId) {
        if (typeof friendId !== 'string' || !friendId.trim()) {
            throw createServiceError('El usuario seleccionado no es válido.', 400);
        }
        if (friendId === userId) {
            throw createServiceError('No puedes añadirte a ti mismo como amigo.', 400);
        }

        const added = await this.store.addFriend({
            userId,
            friendId,
            now: this._now(),
        });
        if (!added) {
            throw createServiceError(
                'No se encontró un usuario disponible para añadir.',
                404,
            );
        }

        return this.getFriends(userId);
    }

    async removeFriend(userId, friendId) {
        if (typeof friendId !== 'string' || !friendId.trim()) {
            throw createServiceError('El usuario seleccionado no es válido.', 400);
        }

        const removed = await this.store.removeFriend({
            userId,
            friendId,
            now: this._now(),
        });
        if (!removed) {
            throw createServiceError('No se pudo actualizar la lista de amigos.', 404);
        }

        return this.getFriends(userId);
    }

    async resetAdminUserPassword(userId) {
        const user = await this._getAdminUser(userId);
        if (!user.activatedAt || user.deletedAt) {
            throw createServiceError(
                'No se puede restablecer la contraseña de esta cuenta.',
                409,
            );
        }

        await this._sendPasswordReset(user.emailNormalized);
    }

    async setAdminStatus(userId, isAdmin, actingUserId) {
        if (typeof isAdmin !== 'boolean') {
            throw createServiceError('El estado de administrador no es válido.', 400);
        }
        if (userId === actingUserId) {
            throw createServiceError(
                'Otro administrador debe cambiar tus permisos.',
                403,
            );
        }

        const user = await this._getAdminUser(userId);
        if (user.deletedAt) {
            throw createServiceError(
                'Restaura la cuenta antes de cambiar sus permisos.',
                409,
            );
        }
        if (!isAdmin) {
            await this._assertAnotherActiveAdminRemains(user);
        }

        const updated = await this.store.updateAdminStatus({
            userId,
            isAdmin,
            now: this._now(),
        });
        if (!updated) {
            throw createServiceError('No se pudo actualizar el usuario.', 404);
        }

        return this._formatAdminUser(updated);
    }

    async banUser(userId, actingUserId) {
        if (userId === actingUserId) {
            throw createServiceError('No puedes banear tu propia cuenta.', 403);
        }

        const user = await this._getAdminUser(userId);
        if (user.deletedAt) {
            throw createServiceError(
                'Restaura la cuenta antes de cambiar su estado de bloqueo.',
                409,
            );
        }
        if (user.bannedAt) {
            return this._formatAdminUser(user);
        }

        await this._assertAnotherActiveAdminRemains(user);
        const banned = await this.store.banUser({userId, now: this._now()});
        if (!banned) {
            throw createServiceError('No se pudo bloquear el usuario.', 404);
        }

        return this._formatAdminUser(banned);
    }

    async unbanUser(userId, actingUserId) {
        if (userId === actingUserId) {
            throw createServiceError(
                'No puedes quitar el baneo de tu propia cuenta.',
                403,
            );
        }

        const user = await this._getAdminUser(userId);
        if (user.deletedAt) {
            throw createServiceError(
                'Restaura la cuenta antes de cambiar su estado de bloqueo.',
                409,
            );
        }
        if (!user.bannedAt) {
            return this._formatAdminUser(user);
        }

        const unbanned = await this.store.unbanUser({userId, now: this._now()});
        if (!unbanned) {
            throw createServiceError('No se pudo quitar el bloqueo del usuario.', 404);
        }

        return this._formatAdminUser(unbanned);
    }

    async softDeleteUser(userId) {
        const user = await this._getAdminUser(userId);
        if (user.deletedAt) {
            return this._formatAdminUser(user);
        }

        await this._assertAdminCanBeDeleted(user);
        await this._assertAnotherActiveAdminRemains(user);
        const deleted = await this.store.softDeleteUser({userId, now: this._now()});
        if (!deleted) {
            throw createServiceError('No se pudo eliminar el usuario.', 404);
        }

        return this._formatAdminUser(deleted);
    }

    async restoreUser(userId) {
        const user = await this._getAdminUser(userId);
        if (!user.deletedAt) {
            throw createServiceError('La cuenta no está eliminada.', 409);
        }

        const restored = await this.store.restoreUser({userId, now: this._now()});
        if (!restored) {
            throw createServiceError('No se pudo restaurar el usuario.', 404);
        }

        return this._formatAdminUser(restored);
    }

    async permanentlyDeleteUser(userId) {
        const user = await this._getAdminUser(userId);
        if (!user.deletedAt) {
            throw createServiceError(
                'El usuario debe estar eliminado antes de borrarlo definitivamente.',
                409,
            );
        }

        await this._assertAdminCanBeDeleted(user);
        const deleted = await this.store.permanentlyDeleteUser({
            userId,
            now: this._now(),
        });
        if (!deleted) {
            throw createServiceError('No se pudo eliminar definitivamente el usuario.', 404);
        }

        return this._formatAdminUser(deleted);
    }

    async getPendingPasswordResetEmail(token) {
        if (typeof token !== 'string' || !token) {
            throw createServiceError('El enlace de recuperación no es válido.', 400);
        }

        const email = await this.store.getPendingPasswordResetEmail(
            hashOpaqueToken(token),
            this._now(),
        );
        if (!email) {
            throw createServiceError('El enlace de recuperación no es válido o ha caducado.', 400);
        }

        return email;
    }

    async completePasswordReset(body) {
        if (!body || typeof body !== 'object' || Array.isArray(body) ||
            typeof body.token !== 'string' || !body.token) {
            throw createServiceError('El enlace de recuperación no es válido.', 400);
        }

        const password = validatePassword(body.password);
        const completed = await this.store.completePasswordReset({
            tokenHash: hashOpaqueToken(body.token),
            passwordHash: await hashPassword(password),
            now: this._now(),
        });
        if (!completed) {
            throw createServiceError('El enlace de recuperación no es válido o ha caducado.', 400);
        }
    }

    async getSession(token) {
        if (!token) {
            return null;
        }

        const user = await this.store.getUserForSession(
            hashOpaqueToken(token),
            this._now(),
        );

        return user ? this._withAdminStatus(user) : null;
    }

    async logout(token) {
        if (token) {
            await this.store.deleteSession(hashOpaqueToken(token));
        }
    }

    async updateDisplayName(userId, body) {
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            throw createServiceError('La solicitud de perfil no es válida.', 400);
        }

        const displayName = validateDisplayName(body.name);
        const user = await this.store.updateDisplayName({
            userId,
            displayName,
            now: this._now(),
        });
        if (!user) {
            throw createServiceError('No se pudo actualizar el perfil.', 404);
        }

        return this._withAdminStatus(user);
    }

    async changePassword({userId, sessionToken, body}) {
        if (!body || typeof body !== 'object' || Array.isArray(body) ||
            typeof body.currentPassword !== 'string' ||
            typeof body.newPassword !== 'string') {
            throw createServiceError('La solicitud de cambio de contraseña no es válida.', 400);
        }

        const newPassword = validatePassword(body.newPassword);
        const user = await this.store.getUserPassword(userId);
        const currentPasswordMatches = await verifyPassword(
            body.currentPassword,
            user?.passwordHash || dummyPasswordHash,
        );
        if (!user || !currentPasswordMatches) {
            throw createServiceError('La contraseña actual no es válida.', 401);
        }

        const updated = await this.store.updatePassword({
            userId,
            passwordHash: await hashPassword(newPassword),
            preserveSessionTokenHash: hashOpaqueToken(sessionToken),
            now: this._now(),
        });
        if (!updated) {
            throw createServiceError('No se pudo actualizar la contraseña.', 404);
        }
    }

}

export const createUserAuthService = options => new UserAuthService(options);
