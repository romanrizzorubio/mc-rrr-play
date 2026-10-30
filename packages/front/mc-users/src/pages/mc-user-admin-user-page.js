import {html} from 'lit-element';

import {McUsersPage} from './mc-users-page.js';

export class McUserAdminUserPage extends McUsersPage {
    static get is() {
        return 'mc-user-admin-user-page';
    }
    static get route() {
        return 'user-detail';
    }
    static get path() {
        return '/users/:id';
    }
    static get styles() {
        return [super.styles];
    }
    static get properties() {
        return {
            ...super.properties,
            selectedAdminUser: {type: Object},
            currentUser: {type: Object},
            confirmPermanentDelete: {type: Boolean},
        };
    }
    constructor() {
        super();

        this.selectedAdminUser = null;
        this.currentUser = null;
        this.confirmPermanentDelete = false;
    }
    deletePermanently() {
        this.confirmPermanentDelete = false;
        this.dispatchAction('adminDeletePermanently');
    }
    render() {
        if (!this.selectedAdminUser) {
            return this.renderPage(html`
                <h1>Detalle de usuario</h1>
                ${this.busy ? html`
                    <p role="status">Cargando usuario...</p>
                ` : ''}
                ${this.renderLinks([['Volver a usuarios', '/users']])}
            `, 'admin-page');
        }

        const selectedUser = this.selectedAdminUser;
        const status = selectedUser.isDeleted ?
            'Eliminado lógicamente' :
            selectedUser.isBanned ?
                'Baneado' :
                selectedUser.isActivated ?
                    'Activo' :
                    'Pendiente de activación';
        const isCurrentUser = selectedUser.id === this.currentUser?.id;

        return this.renderPage(html`
            <h1>Detalle de usuario</h1>
            <p><strong>Nombre:</strong> ${selectedUser.name}</p>
            <p><strong>Email:</strong> <span class="email">${selectedUser.email}</span></p>
            <p class="admin-user-status">Estado: ${status}</p>
            <label class="admin-user-role">
                <input
                    type="checkbox"
                    aria-label="Administrador"
                    .checked="${selectedUser.isAdmin}"
                    .disabled="${this.busy || selectedUser.isDeleted || isCurrentUser}"
                    @change="${event => this.dispatchAction('setAdminStatus', {
                        isAdmin: event.target.checked,
                    })}"
                >
                <span>Administrador</span>
            </label>
            ${isCurrentUser ? html`
                <p class="admin-user-status">
                    No puedes cambiar tu propio rol ni banear o quitar el baneo
                    de tu cuenta.
                </p>
            ` : ''}
            <div class="admin-user-actions">
                ${!selectedUser.isDeleted ? html`
                    <md-filled-button
                        type="button"
                        .disabled="${this.busy || !selectedUser.isActivated}"
                        @click="${() => this.dispatchAction('adminResetPassword')}"
                    >Restablecer contraseña</md-filled-button>
                ` : ''}
                ${!isCurrentUser && !selectedUser.isDeleted &&
                    !selectedUser.isBanned ? html`
                    <md-filled-button
                        type="button"
                        class="danger"
                        .disabled="${this.busy}"
                        @click="${() => this.dispatchAction('adminBanUser')}"
                    >Banear</md-filled-button>
                ` : ''}
                ${!isCurrentUser && !selectedUser.isDeleted &&
                    selectedUser.isBanned ? html`
                    <md-filled-button
                        type="button"
                        .disabled="${this.busy}"
                        @click="${() => this.dispatchAction('adminUnbanUser')}"
                    >Quitar baneo</md-filled-button>
                ` : ''}
                ${!selectedUser.isDeleted ? html`
                    <md-filled-button
                        type="button"
                        class="danger"
                        .disabled="${this.busy}"
                        @click="${() => this.dispatchAction('adminSoftDeleteUser')}"
                    >Borrar lógicamente</md-filled-button>
                ` : html`
                    <md-filled-button
                        type="button"
                        .disabled="${this.busy}"
                        @click="${() => this.dispatchAction('adminRestoreUser')}"
                    >Restaurar usuario</md-filled-button>
                    <md-filled-button
                        type="button"
                        class="danger"
                        .disabled="${this.busy}"
                        @click="${() => { this.confirmPermanentDelete = true; }}"
                    >Eliminar definitivamente</md-filled-button>
                `}
            </div>
            <md-dialog
                class="admin-user-delete-dialog"
                .open="${this.confirmPermanentDelete}"
                aria-labelledby="permanent-delete-headline"
            >
                <div slot="headline" id="permanent-delete-headline">
                    Eliminar usuario definitivamente
                </div>
                <div slot="content">
                    <p>
                        Esta acción no se puede deshacer. Se eliminará la cuenta y
                        todos los mazos que creó.
                    </p>
                </div>
                <div slot="actions">
                    <md-text-button
                        type="button"
                        @click="${() => { this.confirmPermanentDelete = false; }}"
                    >Cancelar</md-text-button>
                    <md-text-button
                        type="button"
                        class="danger"
                        .disabled="${this.busy}"
                        @click="${this.deletePermanently.bind(this)}"
                    >Eliminar definitivamente</md-text-button>
                </div>
            </md-dialog>
            ${this.renderLinks([['Volver a usuarios', '/users']])}
        `, 'admin-page');
    }
}

if (!globalThis.window?.customElements.get(McUserAdminUserPage.is)) {
    globalThis.window?.customElements.define(
        McUserAdminUserPage.is,
        McUserAdminUserPage,
    );
}
