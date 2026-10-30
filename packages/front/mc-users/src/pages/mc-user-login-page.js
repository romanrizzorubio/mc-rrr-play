import {html} from 'lit-element';
import {McUsersPage} from './mc-users-page.js';

export class McUserLoginPage extends McUsersPage {
    static get is() {
        return 'mc-user-login-page';
    }
    static get route() {
        return 'login';
    }
    static get path() {
        return '/login';
    }
    render() {
        return this.renderPage(html`
            <h1>Iniciar sesión</h1>
            <form @submit="${event => this.submit(event, 'login')}">
                ${this.emailInput('username')}
                ${this.passwordInput(
                    'password',
                    'Contraseña',
                    'current-password',
                )}
                <md-filled-button type="submit" .disabled="${this.busy}">
                    ${this.busy ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </md-filled-button>
            </form>
            ${this.renderLinks([
                ['Recuperar contraseña', '/forgot-password'],
                ['Crear un nuevo usuario', '/register'],
            ])}
        `);
    }
}

if (!globalThis.window?.customElements.get(McUserLoginPage.is)) {
    globalThis.window?.customElements.define(
        McUserLoginPage.is,
        McUserLoginPage,
    );
}
