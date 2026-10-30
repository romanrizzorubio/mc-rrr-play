import {html} from 'lit-element';
import {McUsersPage} from './mc-users-page.js';

export class McUserResetPasswordPage extends McUsersPage {
    static get is() {
        return 'mc-user-reset-password-page';
    }
    static get route() {
        return 'reset-password';
    }
    static get path() {
        return '/reset-password';
    }
    render() {
        return this.renderPage(html`
            <h1>Restablecer contraseña</h1>
            <p>Email de la cuenta:
                <span class="email">${this.formState.email || 'Cargando...'}</span>
            </p>
            <form @submit="${event =>
                this.submit(event, 'resetPassword')}">
                ${this.passwordInput('password', 'Contraseña', 'new-password')}
                ${this.passwordGuidance()}
                ${this.passwordConfirmation()}
                <md-filled-button
                    type="submit"
                    .disabled="${this.busy || !this.formState.token}"
                >
                    ${this.busy ? 'Guardando...' : 'Guardar contraseña'}
                </md-filled-button>
            </form>
        `);
    }
}

if (!globalThis.window?.customElements.get(McUserResetPasswordPage.is)) {
    globalThis.window?.customElements.define(
        McUserResetPasswordPage.is,
        McUserResetPasswordPage,
    );
}
