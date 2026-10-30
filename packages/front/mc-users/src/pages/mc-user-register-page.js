import {html} from 'lit-element';
import {McUsersPage} from './mc-users-page.js';

export class McUserRegisterPage extends McUsersPage {
    static get is() {
        return 'mc-user-register-page';
    }
    static get route() {
        return 'register';
    }
    static get path() {
        return '/register';
    }
    render() {
        return this.renderPage(html`
            <h1>Crear usuario</h1>
            <form @submit="${event => this.submit(event, 'register')}">
                ${this.emailInput()}
                ${this.nameInput()}
                <md-filled-button type="submit" .disabled="${this.busy}">
                    ${this.busy ? 'Enviando...' : 'Crear usuario'}
                </md-filled-button>
            </form>
            ${this.renderLinks([['Iniciar sesión', '/login']])}
        `);
    }
}

if (!globalThis.window?.customElements.get(McUserRegisterPage.is)) {
    globalThis.window?.customElements.define(
        McUserRegisterPage.is,
        McUserRegisterPage,
    );
}
