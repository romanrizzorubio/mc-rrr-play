export const loadUserServiceConfig = (environment = process.env) => {
    const port = Number(environment.PORT || 3003);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('PORT must be an integer between 1 and 65535.');
    }

    if (!environment.FRONTEND_ORIGIN) {
        throw new Error('FRONTEND_ORIGIN must be configured.');
    }
    if (environment.SESSION_COOKIE_SECURE !== undefined &&
        !['true', 'false'].includes(environment.SESSION_COOKIE_SECURE)) {
        throw new Error('SESSION_COOKIE_SECURE must be true or false.');
    }

    let frontendUrl;
    try {
        frontendUrl = new URL(environment.FRONTEND_ORIGIN);
    } catch {
        throw new Error('FRONTEND_ORIGIN must be a valid HTTP or HTTPS origin.');
    }

    if (!['http:', 'https:'].includes(frontendUrl.protocol) ||
        frontendUrl.username ||
        frontendUrl.password ||
        frontendUrl.pathname !== '/' ||
        frontendUrl.search ||
        frontendUrl.hash) {
        throw new Error('FRONTEND_ORIGIN must be a valid HTTP or HTTPS origin.');
    }

    return {
        port,
        mongoUri: environment.MONGODB_URI || 'mongodb://localhost:27017',
        mongoDatabase: environment.MONGODB_DATABASE || 'mc',
        frontendOrigin: frontendUrl.origin,
        smtp: {
            host: environment.SMTP_HOST,
            port: environment.SMTP_PORT,
            user: environment.SMTP_USER,
            password: environment.SMTP_PASSWORD,
            from: environment.SMTP_FROM,
        },
        secureCookies: environment.SESSION_COOKIE_SECURE !== 'false',
    };
};
