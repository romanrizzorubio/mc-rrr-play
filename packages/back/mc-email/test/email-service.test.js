import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    createAccountActivationEmail,
    createPasswordResetEmail,
    createSmtpMailer,
} from '../src/index.js';

describe('mc-email', () => {
    test('requires SMTP settings and paired credentials', () => {
        const unconfiguredMailer = createSmtpMailer({});

        assert.throws(
            () => unconfiguredMailer.assertConfigured(),
            error => error.statusCode === 503 &&
                error.message.includes('SMTP_HOST'),
        );
        assert.throws(
            () => createSmtpMailer({
                host: 'mailpit',
                port: '1025',
                user: 'mailer',
                password: '',
                from: 'noreply@example.com',
            }).assertConfigured(),
            error => error.statusCode === 503 &&
                error.message.includes('deben configurarse juntos'),
        );
        assert.throws(
            () => createSmtpMailer({
                host: 'mailpit',
                port: 'not-a-port',
                from: 'noreply@example.com',
            }).assertConfigured(),
            error => error.statusCode === 503 &&
                error.message.includes('SMTP_PORT'),
        );
    });

    test('sends through an injected SMTP transport with local Mailpit settings', async () => {
        let transportOptions;
        let sentMessage;
        const mailer = createSmtpMailer({
            host: 'mailpit',
            port: '1025',
            from: 'MC RRR Play <noreply@example.com>',
            transportFactory: options => {
                transportOptions = options;
                return {
                    sendMail: async message => {
                        sentMessage = message;
                    },
                };
            },
        });

        await mailer.send({
            to: 'player@example.com',
            subject: 'Test',
            text: 'Test message',
        });

        assert.deepEqual(transportOptions, {
            host: 'mailpit',
            port: 1025,
            secure: false,
            requireTLS: false,
        });
        assert.deepEqual(sentMessage, {
            from: 'MC RRR Play <noreply@example.com>',
            to: 'player@example.com',
            subject: 'Test',
            text: 'Test message',
        });
    });

    test('uses authenticated TLS settings for a provider SMTP transport', async () => {
        let transportOptions;
        const mailer = createSmtpMailer({
            host: 'smtp.example.com',
            port: '587',
            user: 'mailer',
            password: 'test-only-password',
            from: 'MC RRR Play <noreply@example.com>',
            transportFactory: options => {
                transportOptions = options;
                return {sendMail: async () => {}};
            },
        });

        await mailer.send({
            to: 'player@example.com',
            subject: 'Test',
            text: 'Test message',
        });

        assert.deepEqual(transportOptions, {
            host: 'smtp.example.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {user: 'mailer', pass: 'test-only-password'},
        });
    });

    test('returns an explicit service error when SMTP delivery fails', async () => {
        const mailer = createSmtpMailer({
            host: 'mailpit',
            port: '1025',
            from: 'noreply@example.com',
            transportFactory: () => ({
                sendMail: async () => {
                    throw Object.assign(new Error('connection refused'), {code: 'ECONNREFUSED'});
                },
            }),
        });

        const originalConsoleError = console.error;
        let loggedError;
        console.error = (...args) => {
            loggedError = args;
        };
        try {
            await assert.rejects(
                mailer.send({
                    to: 'player@example.com',
                    subject: 'Test',
                    text: 'Test message',
                }),
                error => error.statusCode === 503 &&
                    error.message.includes('Comprueba la configuración SMTP'),
            );
        } finally {
            console.error = originalConsoleError;
        }

        assert.deepEqual(loggedError, [
            'Email service SMTP delivery failed',
            {name: 'Error', code: 'ECONNREFUSED'},
        ]);
    });

    test('builds activation and password-reset messages', () => {
        assert.deepEqual(createAccountActivationEmail({
            to: 'player@example.com',
            displayName: 'Player One',
            activationLink: 'https://localhost:8000/activate?token=activation-token',
        }), {
            to: 'player@example.com',
            subject: 'Activa tu cuenta de MC RRR Play',
            text: 'Hola Player One:\n\nActiva tu cuenta y elige una contraseña en este enlace:\n' +
                'https://localhost:8000/activate?token=activation-token\n\nEl enlace caduca en 24 horas.',
        });
        assert.deepEqual(createPasswordResetEmail({
            to: 'player@example.com',
            displayName: 'Player One',
            resetLink: 'https://localhost:8000/reset-password?token=reset-token',
        }), {
            to: 'player@example.com',
            subject: 'Restablece tu contraseña de MC RRR Play',
            text: 'Hola Player One:\n\nElige una nueva contraseña en este enlace:\n' +
                'https://localhost:8000/reset-password?token=reset-token\n\nEl enlace caduca en una hora. ' +
                'Si no solicitaste el cambio, ignora este correo.',
        });
    });
});
