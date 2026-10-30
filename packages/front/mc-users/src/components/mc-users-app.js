import {LitElement} from 'lit-element';
import {html, unsafeStatic} from 'lit/static-html.js';

import {ENDPOINTS} from 'mc-endpoints';
import styles from './mc-users-app.css.js';
import {McUserActivatePage} from '../pages/mc-user-activate-page.js';
import {McUserAdminUserPage} from '../pages/mc-user-admin-user-page.js';
import {McUserAdminUsersPage} from '../pages/mc-user-admin-users-page.js';
import {McUserChangePasswordPage} from '../pages/mc-user-change-password-page.js';
import {McUserForgotPasswordPage} from '../pages/mc-user-forgot-password-page.js';
import {McUserLoginPage} from '../pages/mc-user-login-page.js';
import {McUserProfilePage} from '../pages/mc-user-profile-page.js';
import {McUserRegisterPage} from '../pages/mc-user-register-page.js';
import {McUserResetPasswordPage} from '../pages/mc-user-reset-password-page.js';

export class McUsersApp extends LitElement {
    static get is() {
        return 'mc-users-app';
    }
    static get properties() {
        return {
            serviceUrl: {type: String, attribute: 'service-url'},
            pageRoute: {type: String, attribute: 'page-route'},
            routeParams: {type: Object, attribute: false},
            routeQuery: {type: Object, attribute: false},
            user: {type: Object},
            adminUsers: {type: Array},
            selectedAdminUser: {type: Object},
            friends: {type: Array},
            friendSearchResults: {type: Array},
            friendSearchOpen: {type: Boolean},
            friendSearchCompleted: {type: Boolean},
            friendsBusy: {type: Boolean},
            name: {type: String},
            email: {type: String},
            password: {type: String},
            confirmPassword: {type: String},
            currentPassword: {type: String},
            token: {type: String},
            busy: {type: Boolean},
            notice: {type: String},
            error: {type: String},
        };
    }
    static get styles() {
        return [styles];
    }
    static get pages() {
        return [
            McUserLoginPage,
            McUserRegisterPage,
            McUserActivatePage,
            McUserAdminUsersPage,
            McUserAdminUserPage,
            McUserForgotPasswordPage,
            McUserResetPasswordPage,
            McUserProfilePage,
            McUserChangePasswordPage,
        ].map(Page => ({
            route: Page.route,
            path: Page.path,
            tagName: Page.is,
        }));
    }
    constructor() {
        super();

        this.serviceUrl = '';
        this.pageRoute = 'login';
        this.routeParams = {};
        this.routeQuery = {};
        this.user = null;
        this.adminUsers = [];
        this.selectedAdminUser = null;
        this.friends = [];
        this.friendSearchResults = [];
        this.friendSearchOpen = false;
        this.friendSearchCompleted = false;
        this.friendsBusy = false;
        this.name = '';
        this.email = '';
        this.password = '';
        this.confirmPassword = '';
        this.currentPassword = '';
        this.token = '';
        this.busy = false;
        this.notice = '';
        this.error = '';
        this.lastActivationToken = '';
        this.lastResetToken = '';
    }
    updated(changedProperties) {
        if (changedProperties.has('pageRoute') ||
            changedProperties.has('routeQuery') ||
            changedProperties.has('routeParams')) {
            this.syncRoute();
        }
    }
    syncRoute() {
        this.error = '';
        this.notice = '';
        this.password = '';
        this.confirmPassword = '';
        this.currentPassword = '';
        if (this.pageRoute !== 'profile') {
            this.friendSearchOpen = false;
        }
        if (this.pageRoute === 'activate') {
            this.token = this.routeQuery?.token || '';
            if (this.routeQuery?.email) {
                this.email = this.routeQuery.email;
            } else if (this.token && this.token !== this.lastActivationToken) {
                this.lastActivationToken = this.token;
                this.loadPendingEmail(this.token);
            }
        } else if (this.pageRoute === 'reset-password') {
            this.token = this.routeQuery?.token || '';
            if (this.routeQuery?.email) {
                this.email = this.routeQuery.email;
            } else if (this.token && this.token !== this.lastResetToken) {
                this.lastResetToken = this.token;
                this.loadPendingEmail(this.token, true);
            }
        } else if (this.pageRoute === 'users') {
            this.selectedAdminUser = null;
            this.loadAdminUsers();
        } else if (this.pageRoute === 'user-detail') {
            this.selectedAdminUser = null;
            this.loadAdminUser(this.routeParams?.id);
        } else if (this.pageRoute === 'profile') {
            this.loadFriends();
        }
    }
    async request(endpoint, {method = 'GET', body} = {}) {
        if (!this.serviceUrl || typeof endpoint !== 'string') {
            throw new Error('El servicio de usuarios no está configurado.');
        }

        const response = await fetch(new URL(endpoint, this.serviceUrl), {
            method,
            credentials: 'include',
            headers: body === undefined ? {} : {'Content-Type': 'application/json'},
            ...(body === undefined ? {} : {body: JSON.stringify(body)}),
        });
        const contentType = response.headers.get('content-type') || '';
        const payload = contentType.includes('application/json') ?
            await response.json() :
            null;

        if (!response.ok) {
            throw new Error(payload?.error?.message || 'No se pudo completar la solicitud.');
        }

        return payload;
    }
    async loadPendingEmail(token, reset = false) {
        try {
            const endpoint = reset ?
                ENDPOINTS.USER.PASSWORD_RESET_EMAIL :
                ENDPOINTS.USER.ACTIVATION_EMAIL;
            const response = await this.request(
                `${endpoint}?token=${encodeURIComponent(token)}`
            );
            this.email = response.email || '';
        } catch (error) {
            this.error = error.message;
        }
    }
    get formState() {
        return {
            email: this.email,
            name: this.name,
            password: this.password,
            confirmPassword: this.confirmPassword,
            currentPassword: this.currentPassword,
            token: this.token,
        };
    }
    handlePageInput(event) {
        const {field, value} = event.detail || {};
        if (typeof value !== 'string') {
            return;
        }

        switch (field) {
            case 'email':
            case 'name':
            case 'password':
            case 'confirmPassword':
            case 'currentPassword':
                this[field] = value;
                break;
            default:
                break;
        }
    }
    handlePageSubmit(event) {
        const actions = {
            login: () => this.login(),
            register: () => this.register(),
            activate: () => this.activate(),
            requestPasswordReset: () => this.requestPasswordReset(),
            resetPassword: () => this.resetPassword(),
            saveProfile: () => this.saveProfile(),
            changePassword: () => this.changePassword(),
            adminResetPassword: () => this.runAdminAction('adminResetPassword'),
            adminBanUser: () => this.runAdminAction('adminBanUser'),
            adminUnbanUser: () => this.runAdminAction('adminUnbanUser'),
            adminSoftDeleteUser: () => this.runAdminAction('adminSoftDeleteUser'),
            adminRestoreUser: () => this.runAdminAction('adminRestoreUser'),
            adminDeletePermanently: () =>
                this.runAdminAction('adminDeletePermanently'),
            setAdminStatus: () => this.runAdminAction(
                'setAdminStatus',
                {isAdmin: event.detail?.isAdmin},
            ),
            openFriendSearch: () => this.openFriendSearch(),
            closeFriendSearch: () => this.closeFriendSearch(),
            clearFriendSearch: () => this.clearFriendSearch(),
            searchFriends: () => this.searchFriends(event.detail?.query),
            addFriend: () => this.updateFriend('add', event.detail?.friendId),
            removeFriend: () => this.updateFriend('remove', event.detail?.friendId),
        };
        const actionName = event.detail?.action;
        const action = Object.hasOwn(actions, actionName) ?
            actions[actionName] :
            null;

        if (!action) {
            this.error = 'No se reconoce la acción de la página de usuario.';
            return;
        }

        return action();
    }
    async submit(action) {
        if (this.busy) {
            return;
        }

        this.busy = true;
        this.error = '';
        this.notice = '';
        try {
            await action();
        } catch (error) {
            this.error = error.message;
        } finally {
            this.busy = false;
        }
    }
    async login() {
        await this.submit(async () => {
            const result = await this.request(ENDPOINTS.USER.LOGIN, {
                method: 'POST',
                body: {email: this.email, password: this.password},
            });
            this.dispatchEvent(new CustomEvent('user-authenticated', {
                detail: {user: result.user},
                bubbles: true,
                composed: true,
            }));
        });
    }
    async register() {
        await this.submit(async () => {
            await this.request(ENDPOINTS.USER.REGISTER, {
                method: 'POST',
                body: {email: this.email, name: this.name},
            });
            this.notice = 'Te hemos enviado un enlace para activar tu cuenta.';
        });
    }
    async activate() {
        await this.submit(async () => {
            this.assertPasswordConfirmation();
            const result = await this.request(ENDPOINTS.USER.ACTIVATE, {
                method: 'POST',
                body: {token: this.token, password: this.password},
            });
            this.dispatchEvent(new CustomEvent('user-authenticated', {
                detail: {user: result.user},
                bubbles: true,
                composed: true,
            }));
        });
    }
    async requestPasswordReset() {
        await this.submit(async () => {
            await this.request(ENDPOINTS.USER.REQUEST_PASSWORD_RESET, {
                method: 'POST',
                body: {email: this.email},
            });
            this.notice =
                'Si existe una cuenta con ese email, recibirás un enlace para cambiar la contraseña.';
        });
    }
    async resetPassword() {
        await this.submit(async () => {
            this.assertPasswordConfirmation();
            await this.request(ENDPOINTS.USER.RESET_PASSWORD, {
                method: 'POST',
                body: {token: this.token, password: this.password},
            });
            this.notice = 'Contraseña actualizada. Ya puedes iniciar sesión.';
            this.password = '';
            this.confirmPassword = '';
        });
    }
    async saveProfile() {
        await this.submit(async () => {
            const result = await this.request(ENDPOINTS.USER.UPDATE_PROFILE, {
                method: 'PATCH',
                body: {name: this.name},
            });
            this.user = result.user;
            this.dispatchEvent(new CustomEvent('user-updated', {
                detail: {user: result.user},
                bubbles: true,
                composed: true,
            }));
            this.notice = 'Datos de usuario actualizados.';
        });
    }
    async changePassword() {
        await this.submit(async () => {
            this.assertPasswordConfirmation();
            await this.request(ENDPOINTS.USER.CHANGE_PASSWORD, {
                method: 'POST',
                body: {
                    currentPassword: this.currentPassword,
                    newPassword: this.password,
                },
            });
            this.notice = 'Contraseña actualizada.';
            this.password = '';
            this.confirmPassword = '';
            this.currentPassword = '';
        });
    }
    openFriendSearch() {
        this.friendSearchResults = [];
        this.friendSearchCompleted = false;
        this.friendSearchOpen = true;
    }
    closeFriendSearch() {
        this.friendSearchOpen = false;
    }
    clearFriendSearch() {
        this.friendSearchResults = [];
        this.friendSearchCompleted = false;
    }
    async loadFriends() {
        const route = this.pageRoute;
        this.friendsBusy = true;
        this.error = '';
        try {
            const result = await this.request(ENDPOINTS.USER.FRIENDS);
            if (this.pageRoute === route) {
                this.friends = result.friends;
            }
        } catch (error) {
            if (this.pageRoute === route) {
                this.error = error.message;
            }
        } finally {
            if (this.pageRoute === route) {
                this.friendsBusy = false;
            }
        }
    }
    async searchFriends(query) {
        if (typeof query !== 'string' || !query.trim()) {
            this.error = 'Escribe un nombre o email para buscar.';
            return;
        }

        await this.submit(async () => {
            const endpoint = `${ENDPOINTS.USER.USER_SEARCH}?query=${
                encodeURIComponent(query.trim())
            }`;
            const result = await this.request(endpoint);
            this.friendSearchResults = result.users;
            this.friendSearchCompleted = true;
        });
    }
    async updateFriend(action, friendId) {
        if (typeof friendId !== 'string' || !friendId) {
            this.error = 'No se encontró el usuario seleccionado.';
            return;
        }

        await this.submit(async () => {
            const endpoint = ENDPOINTS.USER.FRIEND.replace(
                ':id',
                encodeURIComponent(friendId),
            );
            const result = await this.request(endpoint, {
                method: action === 'add' ? 'POST' : 'DELETE',
            });
            this.friends = result.friends;
            this.friendSearchResults = this.friendSearchResults.map(user =>
                user.id === friendId ?
                    {...user, isFriend: action === 'add'} :
                    user
            );
            this.notice = action === 'add' ?
                'Usuario añadido a tus amigos.' :
                'Usuario eliminado de tus amigos.';
        });
    }
    async loadAdminUsers() {
        const route = this.pageRoute;
        this.busy = true;
        this.error = '';
        try {
            const result = await this.request(ENDPOINTS.USER.USERS);
            if (this.pageRoute === route) {
                this.adminUsers = result.users;
            }
        } catch (error) {
            if (this.pageRoute === route) {
                this.error = error.message;
            }
        } finally {
            if (this.pageRoute === route) {
                this.busy = false;
            }
        }
    }
    async loadAdminUser(userId) {
        const route = this.pageRoute;
        if (typeof userId !== 'string' || !userId) {
            this.error = 'No se encontró el identificador del usuario.';
            return;
        }

        this.busy = true;
        this.error = '';
        try {
            const endpoint = ENDPOINTS.USER.USER_BY_ID.replace(
                ':id',
                encodeURIComponent(userId),
            );
            const result = await this.request(endpoint);
            if (this.pageRoute === route && this.routeParams?.id === userId) {
                this.selectedAdminUser = result.user;
            }
        } catch (error) {
            if (this.pageRoute === route && this.routeParams?.id === userId) {
                this.error = error.message;
            }
        } finally {
            if (this.pageRoute === route && this.routeParams?.id === userId) {
                this.busy = false;
            }
        }
    }
    async runAdminAction(actionName, parameters = {}) {
        const userId = this.routeParams?.id;
        if (typeof userId !== 'string' || !userId) {
            this.error = 'No se encontró el identificador del usuario.';
            return;
        }

        const routeByAction = {
            adminResetPassword: {
                endpoint: ENDPOINTS.USER.USER_PASSWORD_RESET,
                method: 'POST',
            },
            adminBanUser: {
                endpoint: ENDPOINTS.USER.USER_BAN,
                method: 'POST',
            },
            adminUnbanUser: {
                endpoint: ENDPOINTS.USER.USER_UNBAN,
                method: 'POST',
            },
            adminSoftDeleteUser: {
                endpoint: ENDPOINTS.USER.USER_BY_ID,
                method: 'DELETE',
            },
            adminRestoreUser: {
                endpoint: ENDPOINTS.USER.USER_RESTORE,
                method: 'POST',
            },
            adminDeletePermanently: {
                endpoint: ENDPOINTS.USER.USER_PERMANENT_DELETE,
                method: 'DELETE',
            },
            setAdminStatus: {
                endpoint: ENDPOINTS.USER.USER_BY_ID,
                method: 'PATCH',
            },
        };
        const config = routeByAction[actionName];
        if (!config) {
            this.error = 'No se reconoce la acción de gestión de usuarios.';
            return;
        }

        await this.submit(async () => {
            const endpoint = config.endpoint.replace(
                ':id',
                encodeURIComponent(userId),
            );
            const result = await this.request(endpoint, {
                method: config.method,
                ...(actionName === 'setAdminStatus' ?
                    {body: {isAdmin: parameters.isAdmin}} :
                    {}),
            });

            if (actionName === 'adminResetPassword') {
                this.notice = result.message;
                return;
            }
            if (actionName === 'adminDeletePermanently') {
                this.notice = 'Usuario y mazos eliminados definitivamente.';
                this.dispatchEvent(new CustomEvent('navigate-route', {
                    detail: {route: '/users'},
                    bubbles: true,
                    composed: true,
                }));
                return;
            }

            this.selectedAdminUser = result.user;
            const successMessages = {
                adminBanUser: 'Usuario baneado.',
                adminUnbanUser: 'Se ha quitado el baneo al usuario.',
                adminSoftDeleteUser: 'Usuario eliminado lógicamente.',
                adminRestoreUser: 'Usuario restaurado.',
                setAdminStatus: 'Permisos de usuario actualizados.',
            };
            this.notice = successMessages[actionName];

            if (userId === this.user?.id) {
                if (actionName === 'adminBanUser' ||
                    actionName === 'adminSoftDeleteUser') {
                    this.dispatchEvent(new CustomEvent('user-session-invalidated', {
                        bubbles: true,
                        composed: true,
                    }));
                } else if (actionName === 'setAdminStatus') {
                    this.dispatchEvent(new CustomEvent('user-updated', {
                        detail: {
                            user: {
                                id: result.user.id,
                                email: result.user.email,
                                name: result.user.name,
                                isAdmin: result.user.isAdmin,
                            },
                        },
                        bubbles: true,
                        composed: true,
                    }));
                }
            }
        });
    }
    assertPasswordConfirmation() {
        if (!this.isPasswordValid(this.password)) {
            throw new Error(
                'La contraseña debe tener entre 10 y 128 caracteres y cumplir al menos ' +
                '3 de estas condiciones: minúsculas, mayúsculas, números o símbolos.'
            );
        }
        if (this.password !== this.confirmPassword) {
            throw new Error('Las contraseñas no coinciden.');
        }
    }
    isPasswordValid(password) {
        if (typeof password !== 'string' ||
            password.length < 10 ||
            password.length > 128) {
            return false;
        }

        const characterClasses = [
            /\p{Ll}/u,
            /\p{Lu}/u,
            /\p{N}/u,
            /[^\p{L}\p{N}]/u,
        ];

        return characterClasses.filter(characterClass =>
            characterClass.test(password)
        ).length >= 3;
    }
    renderRoute() {
        const page = McUsersApp.pages.find(({route}) =>
            route === this.pageRoute
        );

        if (!page) {
            return html`<p role="alert">No se encontró la página de usuario.</p>`;
        }

        const tagName = unsafeStatic(page.tagName);

        return html`
            <${tagName}
                .formState="${this.formState}"
                .user="${this.user}"
                .adminUsers="${this.adminUsers}"
                .selectedAdminUser="${this.selectedAdminUser}"
                .currentUser="${this.user}"
                .friends="${this.friends}"
                .friendSearchResults="${this.friendSearchResults}"
                .friendSearchOpen="${this.friendSearchOpen}"
                .friendSearchCompleted="${this.friendSearchCompleted}"
                .friendsBusy="${this.friendsBusy}"
                .busy="${this.busy}"
                .notice="${this.notice}"
                .error="${this.error}"
                @user-field-change="${this.handlePageInput.bind(this)}"
                @user-form-submit="${this.handlePageSubmit.bind(this)}"
            ></${tagName}>
        `;
    }
    render() {
        return this.renderRoute();
    }
}

if (!globalThis.window?.customElements.get(McUsersApp.is)) {
    globalThis.window?.customElements.define(McUsersApp.is, McUsersApp);
}
