import {LitElement, html} from 'lit-element';

import styles from './mc-chat.css.js';

export class ChatComponent extends LitElement {
    static get is() {
        return 'mc-chat';
    }
    static get styles() {
        return styles;
    }
    static get properties() {
        return {
            api: {type: Object},
            collapsed: {type: Boolean},
            enabled: {type: Boolean},
            messages: {type: Array},
            messageDraft: {type: String},
            error: {type: String},
            sending: {type: Boolean},
        };
    }
    constructor() {
        super();

        this.api = null;
        this.collapsed = true;
        this.enabled = false;
        this.messages = [];
        this.messageDraft = '';
        this.error = '';
        this.sending = false;
        this.unsubscribeChatState = null;
        this.unsubscribeChatMessage = null;
    }
    connectedCallback() {
        super.connectedCallback();
        this.subscribeToChat();
    }
    disconnectedCallback() {
        this.unsubscribeFromChat();
        super.disconnectedCallback();
    }
    updated(changedProperties) {
        if (changedProperties.has('api')) {
            this.unsubscribeFromChat();
            this.subscribeToChat();
        }
    }
    subscribeToChat() {
        if (!this.api) {
            return;
        }

        this.unsubscribeChatState =
            this.api.listenChatState(state => {
                this.enabled = state?.enabled === true;
                this.messages = this.enabled && Array.isArray(state?.messages) ?
                    state.messages :
                    [];
                this.error = '';
            });
        this.unsubscribeChatMessage =
            this.api.listenChatMessage(message => {
                if (!this.enabled || !message?.id ||
                    this.messages.some(existing => existing.id === message.id)) {
                    return;
                }
                this.messages = [...this.messages, message].slice(-100);
            });
    }
    unsubscribeFromChat() {
        this.unsubscribeChatState?.();
        this.unsubscribeChatMessage?.();
        this.unsubscribeChatState = null;
        this.unsubscribeChatMessage = null;
    }
    toggleCollapsed() {
        this.collapsed = !this.collapsed;
    }
    async sendMessage(event) {
        event.preventDefault();
        const message = this.messageDraft.trim();
        if (!this.enabled || !message || this.sending) {
            return;
        }

        this.sending = true;
        this.error = '';
        try {
            const response = await this.api.sendChatMessage(message);
            if (response?.ok === false) {
                throw new Error(response.error || 'No se pudo enviar el mensaje.');
            }
            this.messageDraft = '';
        } catch (error) {
            this.error = error.message;
        } finally {
            this.sending = false;
        }
    }
    render() {
        return html`
            <section class="chat ${this.collapsed ? 'collapsed' : ''}">
                <button
                    class="chat-toggle"
                    type="button"
                    aria-expanded="${!this.collapsed}"
                    @click="${this.toggleCollapsed}"
                >
                    <span>Chat</span>
                    ${this.enabled ? '' : html`
                        <span class="chat-status">Peligro</span>
                    `}
                    <span class="chevron ${this.collapsed ? '' : 'open'}"></span>
                </button>
                ${this.collapsed ? '' : html`
                    <div class="chat-content">
                        ${this.enabled ? html`
                            <div class="messages" role="log" aria-live="polite">
                                ${this.messages.map(message => html`
                                    <article class="message">
                                        <strong>${message.userName}</strong>
                                        <span>${message.text}</span>
                                    </article>
                                `)}
                            </div>
                            ${this.error ? html`
                                <p class="chat-error" role="alert">${this.error}</p>
                            ` : ''}
                            <form @submit="${this.sendMessage}">
                                <input
                                    type="text"
                                    aria-label="Mensaje"
                                    maxlength="500"
                                    .value="${this.messageDraft}"
                                    ?disabled="${this.sending}"
                                    @input="${event => {
                                        this.messageDraft = event.target.value;
                                    }}"
                                >
                                <button
                                    type="submit"
                                    ?disabled="${this.sending || !this.messageDraft.trim()}"
                                >Enviar</button>
                            </form>
                        ` : html`
                            <p class="chat-disabled" role="status">
                                El chat está deshabilitado mientras se resuelve Peligro.
                            </p>
                        `}
                    </div>
                `}
            </section>
        `;
    }
}

window.customElements.define(ChatComponent.is, ChatComponent);
