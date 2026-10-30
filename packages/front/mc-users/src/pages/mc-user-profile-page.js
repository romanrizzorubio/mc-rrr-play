import {html} from 'lit-element';
import {McUsersPage} from './mc-users-page.js';

export class McUserProfilePage extends McUsersPage {
    static get is() {
        return 'mc-user-profile-page';
    }
    static get route() {
        return 'profile';
    }
    static get path() {
        return '/profile';
    }
    static get properties() {
        return {
            ...super.properties,
            friends: {type: Array},
            friendSearchResults: {type: Array},
            friendSearchOpen: {type: Boolean},
            friendSearchCompleted: {type: Boolean},
            friendsBusy: {type: Boolean},
            searchQuery: {type: String},
        };
    }
    constructor() {
        super();

        this.friends = [];
        this.friendSearchResults = [];
        this.friendSearchOpen = false;
        this.friendSearchCompleted = false;
        this.friendsBusy = false;
        this.searchQuery = '';
    }
    openFriendSearch() {
        this.searchQuery = '';
        this.friendSearchCompleted = false;
        this.dispatchAction('openFriendSearch');
    }
    closeFriendSearch() {
        this.dispatchAction('closeFriendSearch');
    }
    handleFriendSearchInput(event) {
        this.searchQuery = event.target.value;
        this.friendSearchCompleted = false;
        this.dispatchAction('clearFriendSearch');
    }
    renderFriends() {
        return this.friends.length ? html`
            <ul class="friends-list">
                ${this.friends.map(friend => html`
                    <li>
                        <div>
                            <strong>${friend.name}</strong>
                            <span class="admin-user-email">${friend.email}</span>
                            <span class="admin-user-status">
                                ${friend.isFriendOf ?
                                    'Te ha añadido a su lista de amigos.' :
                                    'No te ha añadido a su lista de amigos.'}
                            </span>
                        </div>
                        <md-text-button
                            type="button"
                            .disabled="${this.busy}"
                            @click="${() => this.dispatchAction('removeFriend', {
                                friendId: friend.id,
                            })}"
                        >Dejar de ser amigo</md-text-button>
                    </li>
                `)}
            </ul>
        ` : html`
            <p>Aún no has añadido amigos.</p>
        `;
    }
    renderFriendSearch() {
        return html`
            <md-dialog
                class="friend-search-dialog"
                .open="${this.friendSearchOpen}"
                aria-labelledby="friend-search-headline"
                @closed="${this.closeFriendSearch.bind(this)}"
            >
                <div slot="headline" id="friend-search-headline">
                    Buscar usuarios
                </div>
                <div slot="content">
                    <form @submit="${event => this.submit(
                        event,
                        'searchFriends',
                        {query: this.searchQuery},
                    )}">
                        <md-filled-text-field
                            label="Nombre o email"
                            type="search"
                            .value="${this.searchQuery}"
                            maxlength="100"
                            required
                            @input="${this.handleFriendSearchInput.bind(this)}"
                        ></md-filled-text-field>
                        <md-filled-button
                            type="submit"
                            .disabled="${this.busy || !this.searchQuery.trim()}"
                        >Buscar</md-filled-button>
                    </form>
                    ${this.friendSearchResults.length ? html`
                        <ul class="friends-list friend-search-results">
                            ${this.friendSearchResults.map(result => html`
                                <li>
                                    <div>
                                        <strong>${result.name}</strong>
                                        <span class="admin-user-email">${result.email}</span>
                                    </div>
                                    <md-text-button
                                        type="button"
                                        .disabled="${this.busy || result.isFriend}"
                                        @click="${() => this.dispatchAction('addFriend', {
                                            friendId: result.id,
                                        })}"
                                    >${result.isFriend ? 'Amigo' : 'Hacer amigo'}</md-text-button>
                                </li>
                            `)}
                        </ul>
                    ` : this.busy ? html`
                        <p role="status">Buscando usuarios...</p>
                    ` : this.friendSearchCompleted ? html`
                        <p>No se encontraron usuarios.</p>
                    ` : ''}
                </div>
                <div slot="actions">
                    <md-text-button
                        type="button"
                        @click="${this.closeFriendSearch.bind(this)}"
                    >Cerrar</md-text-button>
                </div>
            </md-dialog>
        `;
    }
    render() {
        return this.renderPage(html`
            <h1>Mi usuario</h1>
            <p>Email:
                <span class="email">${this.user?.email || ''}</span>
            </p>
            <form @submit="${event => this.submit(event, 'saveProfile')}">
                ${this.nameInput(this.formState.name || this.user?.name || '')}
                <md-elevated-button
                    type="button"
                    @click="${this.handleLink('/change-password')}"
                >Cambiar contraseña</md-elevated-button>
                <md-filled-button type="submit" .disabled="${this.busy}">
                    ${this.busy ? 'Guardando...' : 'Guardar cambios'}
                </md-filled-button>
            </form>
            <section class="friends-section" aria-labelledby="friends-heading">
                <div class="friends-heading">
                    <h2 id="friends-heading">Amigos</h2>
                    <md-filled-button
                        type="button"
                        .disabled="${this.busy}"
                        @click="${this.openFriendSearch.bind(this)}"
                    >Buscar usuarios</md-filled-button>
                </div>
                ${this.friendsBusy ? html`
                    <p role="status">Cargando amigos...</p>
                ` : this.renderFriends()}
            </section>
            ${this.renderFriendSearch()}
        `);
    }
}

if (!globalThis.window?.customElements.get(McUserProfilePage.is)) {
    globalThis.window?.customElements.define(
        McUserProfilePage.is,
        McUserProfilePage,
    );
}
