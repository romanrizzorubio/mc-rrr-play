class SmtpMailer {
    constructor({
        host,
        port,
        user,
        password,
        from,
        transportFactory,
    } = {}) {
        this.host = host;
        this.port = port;
        this.user = user;
        this.password = password;
        this.from = from;
        this.missingConfiguration = Object.entries({
            SMTP_HOST: host,
            SMTP_PORT: port,
            SMTP_FROM: from,
        }).filter(([, value]) => typeof value !== 'string' || !value.trim())
            .map(([name]) => name);
        this.hasUser = typeof user === 'string' && user.trim().length > 0;
        this.hasPassword = typeof password === 'string' && password.trim().length > 0;
        this.smtpPort = Number(port);
        if (transportFactory !== undefined && typeof transportFactory !== 'function') {
            throw new TypeError('transportFactory must be a function.');
        }

        this.transportFactory = transportFactory;
        this.transportPromise = undefined;
    }

    _serviceError(message) {
        return Object.assign(new Error(message), {statusCode: 503});
    }

    assertConfigured() {
        if (this.missingConfiguration.length > 0) {
            throw this._serviceError(
                `El servicio de correo no está configurado. Faltan: ${this.missingConfiguration.join(', ')}.`,
            );
        }
        if (this.hasUser !== this.hasPassword) {
            throw this._serviceError(
                'SMTP_USER y SMTP_PASSWORD deben configurarse juntos o dejarse ambos vacíos.',
            );
        }
        if (!Number.isInteger(this.smtpPort) || this.smtpPort < 1 || this.smtpPort > 65535) {
            throw this._serviceError('SMTP_PORT debe ser un entero entre 1 y 65535.');
        }
    }

    async send({to, subject, text}) {
        this.assertConfigured();
        if (typeof to !== 'string' ||
            typeof subject !== 'string' ||
            typeof text !== 'string') {
            throw new TypeError('SMTP messages require a recipient, subject, and text.');
        }

        if (!this.transportPromise) {
            const transportOptions = {
                host: this.host,
                port: this.smtpPort,
                secure: this.smtpPort === 465,
                requireTLS: this.smtpPort !== 465 && this.smtpPort !== 1025,
                ...(this.hasUser ? {auth: {user: this.user, pass: this.password}} : {}),
            };
            this.transportPromise = Promise.resolve().then(async () => {
                if (this.transportFactory) {
                    return this.transportFactory(transportOptions);
                }

                const {default: nodemailer} = await import('nodemailer');
                return nodemailer.createTransport(transportOptions);
            });
        }

        try {
            const transport = await this.transportPromise;
            return await transport.sendMail({from: this.from, to, subject, text});
        } catch (error) {
            console.error('Email service SMTP delivery failed', {
                name: error.name,
                code: error.code,
            });
            throw this._serviceError(
                'No se pudo enviar el correo. Comprueba la configuración SMTP e inténtalo de nuevo.',
            );
        }
    }
}

export const createSmtpMailer = options => new SmtpMailer(options);
