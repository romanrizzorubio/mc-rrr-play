import {html} from 'lit-element';
import {McUsersPage} from './mc-users-page.js';

export class McUserActivatePage extends McUsersPage {
    static get is() {
        return 'mc-user-activate-page';
    }
    static get route() {
        return 'activate';
    }
    static get path() {
        return '/activate';
    }
    render() {
        return this.renderPage(html`
            <h1>Crear contraseña</h1>
            <p>Email de la cuenta:
                <span class="email">${this.formState.email || 'Cargando...'}</span>
            </p>
            <form @submit="${event => this.submit(event, 'activate')}">
                ${this.passwordInput('password', 'Contraseña', 'new-password')}
                ${this.passwordGuidance()}
                ${this.passwordConfirmation()}
                <md-filled-button
                    type="submit"
                    .disabled="${this.busy || !this.formState.token}"
                >
                    ${this.busy ? 'Guardando...' : 'Activar cuenta y entrar'}
                </md-filled-button>
            </form>
        `);
    }
}

if (!globalThis.window?.customElements.get(McUserActivatePage.is)) {
    globalThis.window?.customElements.define(
        McUserActivatePage.is,
        McUserActivatePage,
    );
}
