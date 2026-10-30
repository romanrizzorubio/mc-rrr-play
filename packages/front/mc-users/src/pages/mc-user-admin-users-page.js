import {html} from 'lit-element';

import {McUsersPage} from './mc-users-page.js';

export class McUserAdminUsersPage extends McUsersPage {
    static get is() {
        return 'mc-user-admin-users-page';
    }
    static get route() {
        return 'users';
    }
    static get path() {
        return '/users';
    }
    static get styles() {
        return [super.styles];
    }
    static get properties() {
        return {
            ...super.properties,
            adminUsers: {type: Array},
            searchQuery: {type: String},
        };
    }
    constructor() {
        super();

        this.adminUsers = [];
        this.searchQuery = '';
    }
    get filteredUsers() {
        const query = this.searchQuery.trim().toLowerCase();
        if (!query) {
            return this.adminUsers;
        }

        return this.adminUsers.filter(user =>
            `${user.name || ''} ${user.email || ''}`.toLowerCase().includes(query)
        );
    }
    openUserDetail(path, event) {
        this.handleLink(path)(event);
    }
    handleRowKeydown(event, path) {
        if (event.key === 'Enter' || event.key === ' ') {
            this.openUserDetail(path, event);
        }
    }
    render() {
        const filteredUsers = this.filteredUsers;

        return this.renderPage(html`
            <h1>Usuarios</h1>
            <p>Gestiona las cuentas y sus permisos.</p>
            <md-filled-text-field
                label="Buscar por nombre o email"
                type="search"
                .value="${this.searchQuery}"
                @input="${event => { this.searchQuery = event.target.value; }}"
            ></md-filled-text-field>
            ${this.busy && !this.adminUsers.length ? html`
                <p role="status">Cargando usuarios...</p>
            ` : ''}
            ${filteredUsers.length ? html`
                <div class="admin-users-table-wrap">
                    <table class="admin-users-table">
                        <thead>
                            <tr>
                                <th scope="col">Usuario</th>
                                <th scope="col">Estado</th>
                                <th scope="col">Permisos</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredUsers.map(user => {
                                const path = `/users/${encodeURIComponent(user.id)}`;
                                const status = user.isDeleted ?
                                    'Eliminado lógicamente' :
                                    user.isBanned ?
                                        'Baneado' :
                                        user.isActivated ?
                                            'Activo' :
                                            'Pendiente de activación';

                                return html`
                                    <tr
                                        class="admin-user-row"
                                        role="link"
                                        tabindex="0"
                                        aria-label="Abrir detalle de ${user.name}"
                                        @click="${event =>
        this.openUserDetail(path, event)}"
                                        @keydown="${event =>
        this.handleRowKeydown(event, path)}"
                                    >
                                        <td>
                                            ${user.name}
                                            <span class="admin-user-email">${user.email}</span>
                                        </td>
                                        <td>${status}</td>
                                        <td>${user.isAdmin ? 'Administrador' : 'Usuario'}</td>
                                    </tr>
                                `;
                            })}
                        </tbody>
                    </table>
                </div>
            ` : this.adminUsers.length ? html`
                <p>No hay usuarios que coincidan con la búsqueda.</p>
            ` : !this.busy ? html`
                <p>No hay usuarios registrados.</p>
            ` : ''}
        `, 'admin-page');
    }
}

if (!globalThis.window?.customElements.get(McUserAdminUsersPage.is)) {
    globalThis.window?.customElements.define(
        McUserAdminUsersPage.is,
        McUserAdminUsersPage,
    );
}
