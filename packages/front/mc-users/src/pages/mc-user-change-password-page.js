import {html} from 'lit-element';
import {McUsersPage} from './mc-users-page.js';

export class McUserChangePasswordPage extends McUsersPage {
    static get is() {
        return 'mc-user-change-password-page';
    }
    static get route() {
        return 'change-password';
    }
    static get path() {
        return '/change-password';
    }
    render() {
        return this.renderPage(html`
            <h1>Cambiar contraseña</h1>
            <p>Email:
                <span class="email">${this.user?.email || ''}</span>
            </p>
            <form @submit="${event => this.submit(event, 'changePassword')}">
                ${this.passwordInput(
                    'currentPassword',
                    'Contraseña actual',
                    'current-password',
                )}
                ${this.passwordInput('password', 'Nueva contraseña', 'new-password')}
                ${this.passwordGuidance()}
                ${this.passwordConfirmation()}
                <md-filled-button type="submit" .disabled="${this.busy}">
                    ${this.busy ? 'Guardando...' : 'Cambiar contraseña'}
                </md-filled-button>
            </form>
        `);
    }
}

if (!globalThis.window?.customElements.get(McUserChangePasswordPage.is)) {
    globalThis.window?.customElements.define(
        McUserChangePasswordPage.is,
        McUserChangePasswordPage,
    );
}
