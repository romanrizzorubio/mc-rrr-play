import {html} from 'lit-element';
import {McUsersPage} from './mc-users-page.js';

export class McUserForgotPasswordPage extends McUsersPage {
    static get is() {
        return 'mc-user-forgot-password-page';
    }
    static get route() {
        return 'forgot-password';
    }
    static get path() {
        return '/forgot-password';
    }
    render() {
        return this.renderPage(html`
            <h1>Recuperar contraseña</h1>
            <form @submit="${event =>
                this.submit(event, 'requestPasswordReset')}">
                ${this.emailInput()}
                <md-filled-button type="submit" .disabled="${this.busy}">
                    ${this.busy ? 'Enviando...' : 'Enviar enlace'}
                </md-filled-button>
            </form>
            ${this.renderLinks([['Volver al inicio de sesión', '/login']])}
        `);
    }
}

if (!globalThis.window?.customElements.get(McUserForgotPasswordPage.is)) {
    globalThis.window?.customElements.define(
        McUserForgotPasswordPage.is,
        McUserForgotPasswordPage,
    );
}
