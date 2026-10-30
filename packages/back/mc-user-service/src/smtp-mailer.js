import {createServiceError} from './utils/auth-utils.js';

export const createSmtpMailer = ({
    host,
    port,
    user,
    password,
    from,
    transportFactory,
}) => {
    const missingConfiguration = Object.entries({
        SMTP_HOST: host,
        SMTP_PORT: port,
        SMTP_FROM: from,
    }).filter(([, value]) => typeof value !== 'string' || !value.trim())
        .map(([name]) => name);
    const hasUser = typeof user === 'string' && user.trim().length > 0;
    const hasPassword = typeof password === 'string' && password.trim().length > 0;
    const smtpPort = Number(port);
    if (transportFactory !== undefined && typeof transportFactory !== 'function') {
        throw new TypeError('transportFactory must be a function.');
    }

    let transportPromise;
    const assertConfigured = () => {
        if (missingConfiguration.length > 0) {
            throw createServiceError(
                `El servicio de correo no está configurado. Faltan: ${missingConfiguration.join(', ')}.`,
                503,
            );
        }
        if (hasUser !== hasPassword) {
            throw createServiceError(
                'SMTP_USER y SMTP_PASSWORD deben configurarse juntos o dejarse ambos vacíos.',
                503,
            );
        }
        if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
            throw createServiceError(
                'SMTP_PORT debe ser un entero entre 1 y 65535.',
                503,
            );
        }
    };

    return {
        assertConfigured,
        async send({to, subject, text}) {
            assertConfigured();
            if (typeof to !== 'string' ||
                typeof subject !== 'string' ||
                typeof text !== 'string') {
                throw new TypeError('SMTP messages require a recipient, subject, and text.');
            }

            if (!transportPromise) {
                const transportOptions = {
                    host,
                    port: smtpPort,
                    secure: smtpPort === 465,
                    requireTLS: smtpPort !== 465 && smtpPort !== 1025,
                    ...(hasUser ? {auth: {user, pass: password}} : {}),
                };
                transportPromise = Promise.resolve().then(async () => {
                    if (transportFactory) {
                        return transportFactory(transportOptions);
                    }

                    const {default: nodemailer} = await import('nodemailer');
                    return nodemailer.createTransport(transportOptions);
                });
            }

            try {
                    const transport = await transportPromise;
                    return await transport.sendMail({from, to, subject, text});
            } catch (error) {
                    console.error('User service SMTP delivery failed', {
                        name: error.name,
                        code: error.code,
                    });
                    throw createServiceError(
                        'No se pudo enviar el correo. Comprueba la configuración SMTP e inténtalo de nuevo.',
                        503,
                    );
            }
        },
    };
};
