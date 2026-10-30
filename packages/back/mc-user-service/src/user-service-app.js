import cors from 'cors';
import express from 'express';

import {readCookie} from './utils/auth-utils.js';
import {asyncHandler, sendError} from './utils/request-utils.js';
import {
    createUserAuthService,
    RESET_REQUEST_MESSAGE,
    SESSION_COOKIE,
    SESSION_COOKIE_PATH,
    SESSION_DURATION_MS,
} from './user-auth-service.js';

export const USER_ROUTES = Object.freeze({
    health: '/healthz',
    register: '/register',
    login: '/login',
    logout: '/logout',
    activate: '/activate',
    activationPreview: '/activation',
    passwordResetRequest: '/password-reset/request',
    passwordReset: '/password-reset',
    me: '/me',
    profile: '/profile',
    passwordChange: '/password/change',
    users: '/users',
    userSearch: '/users/search',
    user: '/users/:id',
    userPasswordReset: '/users/:id/password-reset',
    userBan: '/users/:id/ban',
    userUnban: '/users/:id/unban',
    userRestore: '/users/:id/restore',
    userPermanentDelete: '/users/:id/permanent',
    friends: '/friends',
    friend: '/friends/:id',
});

export const createUserServiceApp = ({
    store,
    mailer,
    frontendOrigin = process.env.FRONTEND_ORIGIN,
    secureCookies = process.env.SESSION_COOKIE_SECURE !== 'false',
    clock,
}) => {
    if (!frontendOrigin) {
        throw new Error('FRONTEND_ORIGIN must be configured.');
    }

    const app = express();
    const auth = createUserAuthService({
        store,
        mailer,
        frontendOrigin,
        ...(clock ? {clock} : {}),
    });
    const cookieOptions = {
        httpOnly: true,
        sameSite: 'lax',
        secure: secureCookies,
        path: SESSION_COOKIE_PATH,
        maxAge: SESSION_DURATION_MS,
    };

    app.use(cors({origin: frontendOrigin, credentials: true}));
    app.use(express.json({limit: '16kb'}));
    app.use((_request, response, next) => {
        response.set('Cache-Control', 'no-store');
        next();
    });

    app.get(USER_ROUTES.health, (_request, response) => {
        response.json({status: 'ok'});
    });

    app.post(USER_ROUTES.register, asyncHandler(async (request, response) => {
        await auth.register(request.body);
        response.status(202).json({
            message: 'Si el correo puede registrarse, recibirás un enlace de activación.',
        });
    }));

    app.post(USER_ROUTES.login, asyncHandler(async (request, response) => {
        const result = await auth.login(request.body);
        response.cookie(SESSION_COOKIE, result.token, cookieOptions);
        response.json({
            authenticated: true,
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.displayName,
                isAdmin: result.user.isAdmin,
            },
        });
    }));

    app.post(USER_ROUTES.activate, asyncHandler(async (request, response) => {
        const result = await auth.activate(request.body);
        response.cookie(SESSION_COOKIE, result.token, cookieOptions);
        response.json({
            activated: true,
            authenticated: true,
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.displayName,
                isAdmin: result.user.isAdmin,
            },
        });
    }));

    app.get(
        USER_ROUTES.activationPreview,
        asyncHandler(async (request, response) => {
            const email = await auth.getPendingActivationEmail(request.query.token);
            response.json({email});
        }),
    );

    app.post(
        USER_ROUTES.passwordResetRequest,
        asyncHandler(async (request, response) => {
            await auth.requestPasswordReset(request.body);
            response.status(202).json({
                message: RESET_REQUEST_MESSAGE,
            });
        }),
    );

    app.get(
        USER_ROUTES.passwordReset,
        asyncHandler(async (request, response) => {
            const email = await auth.getPendingPasswordResetEmail(request.query.token);
            response.json({email});
        }),
    );

    app.post(
        USER_ROUTES.passwordReset,
        asyncHandler(async (request, response) => {
            await auth.completePasswordReset(request.body);
            response.json({passwordChanged: true});
        }),
    );

    app.get(USER_ROUTES.me, asyncHandler(async (request, response) => {
        const sessionToken = readCookie(request, SESSION_COOKIE);
        const user = await auth.getSession(sessionToken);
        if (!user) {
            response.status(401).json({
                error: {
                    message: 'Inicia sesión para continuar.',
                    status: 401,
                },
            });
            return;
        }

        response.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.displayName,
                isAdmin: user.isAdmin,
            },
        });
    }));

    app.post(USER_ROUTES.logout, asyncHandler(async (request, response) => {
        await auth.logout(readCookie(request, SESSION_COOKIE));
        response.clearCookie(SESSION_COOKIE, {
            httpOnly: true,
            sameSite: 'lax',
            secure: secureCookies,
            path: SESSION_COOKIE_PATH,
        });
        response.status(204).end();
    }));

    const requireSession = asyncHandler(async (request, response, next) => {
        const sessionToken = readCookie(request, SESSION_COOKIE);
        const user = await auth.getSession(sessionToken);
        if (!user) {
            response.status(401).json({
                error: {
                    message: 'Inicia sesión para continuar.',
                    status: 401,
                },
            });
            return;
        }

        request.auth = {sessionToken, user};
        next();
    });
    const requireAdmin = (request, response, next) => {
        if (request.auth.user.isAdmin !== true) {
            response.status(403).json({
                error: {
                    message: 'Se requieren permisos de administrador.',
                    status: 403,
                },
            });
            return;
        }

        next();
    };

    app.get(
        USER_ROUTES.userSearch,
        requireSession,
        asyncHandler(async (request, response) => {
            response.json({
                users: await auth.searchUsers(
                    request.auth.user.id,
                    request.query.query,
                ),
            });
        }),
    );

    app.get(
        USER_ROUTES.friends,
        requireSession,
        asyncHandler(async (request, response) => {
            response.json({
                friends: await auth.getFriends(request.auth.user.id),
            });
        }),
    );

    app.post(
        USER_ROUTES.friend,
        requireSession,
        asyncHandler(async (request, response) => {
            response.json({
                friends: await auth.addFriend(
                    request.auth.user.id,
                    request.params.id,
                ),
            });
        }),
    );

    app.delete(
        USER_ROUTES.friend,
        requireSession,
        asyncHandler(async (request, response) => {
            response.json({
                friends: await auth.removeFriend(
                    request.auth.user.id,
                    request.params.id,
                ),
            });
        }),
    );

    app.get(
        USER_ROUTES.users,
        requireSession,
        requireAdmin,
        asyncHandler(async (_request, response) => {
            response.json({users: await auth.getAdminUsers()});
        }),
    );

    app.get(
        USER_ROUTES.user,
        requireSession,
        requireAdmin,
        asyncHandler(async (request, response) => {
            response.json({
                user: await auth.getAdminUser(request.params.id),
            });
        }),
    );

    app.post(
        USER_ROUTES.userPasswordReset,
        requireSession,
        requireAdmin,
        asyncHandler(async (request, response) => {
            await auth.resetAdminUserPassword(request.params.id);
            response.status(202).json({
                message: 'Se ha enviado un enlace para restablecer la contraseña.',
            });
        }),
    );

    app.patch(
        USER_ROUTES.user,
        requireSession,
        requireAdmin,
        asyncHandler(async (request, response) => {
            response.json({
                user: await auth.setAdminStatus(
                    request.params.id,
                    request.body?.isAdmin,
                    request.auth.user.id,
                ),
            });
        }),
    );

    app.post(
        USER_ROUTES.userBan,
        requireSession,
        requireAdmin,
        asyncHandler(async (request, response) => {
            response.json({
                user: await auth.banUser(
                    request.params.id,
                    request.auth.user.id,
                ),
            });
        }),
    );

    app.post(
        USER_ROUTES.userUnban,
        requireSession,
        requireAdmin,
        asyncHandler(async (request, response) => {
            response.json({
                user: await auth.unbanUser(
                    request.params.id,
                    request.auth.user.id,
                ),
            });
        }),
    );

    app.post(
        USER_ROUTES.userRestore,
        requireSession,
        requireAdmin,
        asyncHandler(async (request, response) => {
            response.json({
                user: await auth.restoreUser(request.params.id),
            });
        }),
    );

    app.delete(
        USER_ROUTES.user,
        requireSession,
        requireAdmin,
        asyncHandler(async (request, response) => {
            response.json({
                user: await auth.softDeleteUser(request.params.id),
            });
        }),
    );

    app.delete(
        USER_ROUTES.userPermanentDelete,
        requireSession,
        requireAdmin,
        asyncHandler(async (request, response) => {
            await auth.permanentlyDeleteUser(request.params.id);
            response.json({deleted: true});
        }),
    );

    app.get(USER_ROUTES.profile, requireSession, (request, response) => {
        response.json({
            user: {
                id: request.auth.user.id,
                email: request.auth.user.email,
                name: request.auth.user.displayName,
                isAdmin: request.auth.user.isAdmin,
            },
        });
    });

    app.patch(
        USER_ROUTES.profile,
        requireSession,
        asyncHandler(async (request, response) => {
            const user = await auth.updateDisplayName(request.auth.user.id, request.body);
            response.json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.displayName,
                    isAdmin: user.isAdmin,
                },
            });
        }),
    );

    app.post(
        USER_ROUTES.passwordChange,
        requireSession,
        asyncHandler(async (request, response) => {
            await auth.changePassword({
                userId: request.auth.user.id,
                sessionToken: request.auth.sessionToken,
                body: request.body,
            });
            response.json({passwordChanged: true});
        }),
    );

    app.use((_request, response) => {
        response.status(404).json({
            error: {
                message: 'No se encontró la ruta solicitada.',
                status: 404,
            },
        });
    });
    app.use(sendError);

    return app;
};
