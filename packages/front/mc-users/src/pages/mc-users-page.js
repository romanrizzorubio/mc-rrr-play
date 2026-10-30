import {LitElement, html} from 'lit-element';

import styles from './mc-users-page.css.js';

export class McUsersPage extends LitElement {
    static get properties() {
        return {
            formState: {type: Object, attribute: false},
            user: {type: Object},
            busy: {type: Boolean},
            notice: {type: String},
            error: {type: String},
            showPassword: {type: Boolean},
        };
    }
    static get styles() {
        return [styles];
    }
    constructor() {
        super();

        this.formState = {};
        this.user = null;
        this.busy = false;
        this.notice = '';
        this.error = '';
        this.showPassword = false;
    }
    handleInput(field, event) {
        this.dispatchEvent(new CustomEvent('user-field-change', {
            detail: {
                field,
                value: event.target.value,
            },
            bubbles: true,
            composed: true,
        }));
    }
    submit(event, action, parameters = {}) {
        event.preventDefault();
        this.dispatchAction(action, parameters);
    }
    dispatchAction(action, parameters = {}) {
        this.dispatchEvent(new CustomEvent('user-form-submit', {
            detail: {action, ...parameters},
            bubbles: true,
            composed: true,
        }));
    }
    handleLink(path) {
        return event => {
            event.preventDefault();
            this.dispatchEvent(new CustomEvent('navigate-route', {
                detail: {route: path},
                bubbles: true,
                composed: true,
            }));
        };
    }
    renderLinks(links) {
        return html`
            <div class="links">
                ${links.map(([label, path]) => html`
                    <a href="${path}" @click="${this.handleLink(path)}">${label}</a>
                `)}
            </div>
        `;
    }
    emailInput(autocomplete = 'email') {
        return html`
            <md-filled-text-field
                class="field"
                label="Email"
                type="email"
                autocomplete="${autocomplete}"
                .value="${this.formState.email || ''}"
                required
                @input="${event => this.handleInput('email', event)}"
            ></md-filled-text-field>
        `;
    }
    nameInput(value = this.formState.name || '') {
        return html`
            <md-filled-text-field
                class="field"
                label="Nombre"
                type="text"
                autocomplete="name"
                maxlength="80"
                .value="${value}"
                required
                @input="${event => this.handleInput('name', event)}"
            ></md-filled-text-field>
        `;
    }
    passwordInput(field, label, autocomplete) {
        const inputType = this.showPassword ? 'text' : 'password';

        return html`
            <span class="password-field">
                <md-filled-text-field
                    class="field"
                    label="${label}"
                    type="${inputType}"
                    autocomplete="${autocomplete}"
                    maxlength="128"
                    .value="${this.formState[field] || ''}"
                    required
                    @input="${event => this.handleInput(field, event)}"
                ></md-filled-text-field>
                <md-text-button
                    type="button"
                    aria-label="${this.showPassword ?
                        'Ocultar contraseña' :
                        'Mostrar contraseña'}"
                    @click="${() => { this.showPassword = !this.showPassword; }}"
                >
                    ${this.showPassword ? 'Ocultar' : 'Mostrar'}
                </md-text-button>
            </span>
        `;
    }
    passwordConfirmation() {
        return html`
            <md-filled-text-field
                class="field"
                label="Confirmar contraseña"
                type="${this.showPassword ? 'text' : 'password'}"
                autocomplete="new-password"
                maxlength="128"
                .value="${this.formState.confirmPassword || ''}"
                required
                @input="${event =>
                    this.handleInput('confirmPassword', event)}"
            ></md-filled-text-field>
        `;
    }
    passwordGuidance() {
        return html`
            <p class="password-guidance">
                Entre 10 y 128 caracteres; debe incluir al menos 3 de estos grupos:
                minúsculas, mayúsculas, números y símbolos. No se eliminan espacios.
            </p>
        `;
    }
    renderPage(content, className = '') {
        return html`
            <main class="${className}">
                ${this.error ? html`
                    <p class="error" role="alert">${this.error}</p>
                ` : ''}
                ${this.notice ? html`
                    <p class="notice" role="status">${this.notice}</p>
                ` : ''}
                ${content}
            </main>
        `;
    }
}
