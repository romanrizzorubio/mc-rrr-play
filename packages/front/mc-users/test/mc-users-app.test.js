import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement ??= class {};
globalThis.window ??= {
    customElements: {
        get() {
            return undefined;
        },
        define() {},
    },
};

const {McUsersApp} = await import('../src/components/mc-users-app.js');
const {McUserLoginPage} = await import('../src/pages/mc-user-login-page.js');
const {McUserActivatePage} = await import('../src/pages/mc-user-activate-page.js');
const {McUserAdminUsersPage} = await import(
    '../src/pages/mc-user-admin-users-page.js'
);
const {McUserAdminUserPage} = await import(
    '../src/pages/mc-user-admin-user-page.js'
);
const {McUserProfilePage} = await import(
    '../src/pages/mc-user-profile-page.js'
);
const {McUserChangePasswordPage} = await import(
    '../src/pages/mc-user-change-password-page.js'
);
const {McUserResetPasswordPage} = await import(
    '../src/pages/mc-user-reset-password-page.js'
);
const userPageStyles = (await import('../src/pages/mc-users-page.css.js')).default;

const flattenTemplate = template => template.strings.reduce((markup, part, index) => {
    const value = template.values[index];
    const renderedValue = Array.isArray(value) ?
        value.map(item => item?.strings ? flattenTemplate(item) : '').join('') :
        value?.strings ?
            flattenTemplate(value) :
            typeof value === 'string' || typeof value === 'number' ?
                value :
                '';

    return `${markup}${part}${renderedValue}`;
}, '');

describe('user password forms', () => {
    test('registers each account page with its own route path and component', () => {
        assert.deepEqual(
            McUsersApp.pages.map(({route, path, tagName}) => ({
                route,
                path,
                tagName,
            })),
            [
                {
                    route: 'login',
                    path: '/login',
                    tagName: 'mc-user-login-page',
                },
                {
                    route: 'register',
                    path: '/register',
                    tagName: 'mc-user-register-page',
                },
                {
                    route: 'activate',
                    path: '/activate',
                    tagName: 'mc-user-activate-page',
                },
                {
                    route: 'users',
                    path: '/users',
                    tagName: 'mc-user-admin-users-page',
                },
                {
                    route: 'user-detail',
                    path: '/users/:id',
                    tagName: 'mc-user-admin-user-page',
                },
                {
                    route: 'forgot-password',
                    path: '/forgot-password',
                    tagName: 'mc-user-forgot-password-page',
                },
                {
                    route: 'reset-password',
                    path: '/reset-password',
                    tagName: 'mc-user-reset-password-page',
                },
                {
                    route: 'profile',
                    path: '/profile',
                    tagName: 'mc-user-profile-page',
                },
                {
                    route: 'change-password',
                    path: '/change-password',
                    tagName: 'mc-user-change-password-page',
                },
            ],
        );
    });

    test('renders the login page component from the login route', () => {
        const app = Object.assign(Object.create(McUsersApp.prototype), {
            pageRoute: 'login',
            routeQuery: {},
            email: '',
            name: '',
            password: '',
            confirmPassword: '',
            currentPassword: '',
            token: '',
            user: null,
            busy: false,
            notice: '',
            error: '',
        });
        const markup = flattenTemplate(app.renderRoute());

        assert.match(markup, /<mc-user-login-page/u);
    });

    test('renders account forms with Material Web fields and buttons', () => {
        const page = Object.assign(Object.create(McUserLoginPage.prototype), {
            formState: {email: 'player@example.com', password: ''},
            user: null,
            busy: false,
            notice: '',
            error: '',
            showPassword: false,
        });
        const markup = flattenTemplate(page.render());

        assert.match(markup, /<md-filled-text-field/u);
        assert.match(markup, /<md-filled-button/u);
        assert.match(markup, /<md-text-button/u);
        assert.doesNotMatch(markup, /password-guidance/u);
    });

    test('renders administration details with the exact reset label', () => {
        const detailPage = Object.assign(
            Object.create(McUserAdminUserPage.prototype),
            {
                selectedAdminUser: {
                    id: 'user-1',
                    name: 'Player One',
                    email: 'player@example.com',
                    isActivated: true,
                    isAdmin: false,
                    isBanned: false,
                    isDeleted: false,
                },
                currentUser: {id: 'admin-1', isAdmin: true},
                confirmPermanentDelete: false,
                busy: false,
                notice: '',
                error: '',
            },
        );
        const detailMarkup = flattenTemplate(detailPage.render());

        assert.match(detailMarkup, />Restablecer contraseña</u);
        assert.doesNotMatch(detailMarkup, />Restablecer contraseña de usuario</u);
        assert.match(detailMarkup, />Banear</u);
    });

    test('filters administrators and makes the full row keyboard accessible', () => {
        const usersPage = Object.assign(
            Object.create(McUserAdminUsersPage.prototype),
            {
                adminUsers: [{
                    id: 'user-1',
                    name: 'Player One',
                    email: 'player@example.com',
                    isActivated: true,
                    isAdmin: false,
                    isBanned: false,
                    isDeleted: false,
                }, {
                    id: 'user-2',
                    name: 'Another User',
                    email: 'other@example.com',
                    isActivated: true,
                    isAdmin: true,
                    isBanned: false,
                    isDeleted: false,
                }],
                searchQuery: 'player@example',
                busy: false,
                notice: '',
                error: '',
            },
        );
        const markup = flattenTemplate(usersPage.render());

        assert.match(
            markup,
            /class="admin-user-row"\s+role="link"\s+tabindex="0"/u,
        );
        assert.match(markup, /player@example\.com/u);
        assert.doesNotMatch(markup, /other@example\.com/u);
        assert.doesNotMatch(markup, /href="\/users\/user-1"/u);
    });

    test('renders friends and the friend-search dialog with directional status', () => {
        const profilePage = Object.assign(
            Object.create(McUserProfilePage.prototype),
            {
                formState: {name: 'Alice'},
                user: {email: 'alice@example.com'},
                friends: [{
                    id: 'friend-1',
                    name: 'Bob',
                    email: 'bob@example.com',
                    isFriendOf: true,
                }],
                friendSearchResults: [{
                    id: 'friend-2',
                    name: 'Carol',
                    email: 'carol@example.com',
                    isFriend: false,
                }],
                friendSearchOpen: true,
                friendSearchCompleted: true,
                friendsBusy: false,
                searchQuery: 'Carol',
                busy: false,
                notice: '',
                error: '',
            },
        );
        const markup = flattenTemplate(profilePage.render());

        assert.ok(
            markup.indexOf('<md-elevated-button') <
                markup.indexOf('<md-filled-button type="submit"'),
        );
        assert.doesNotMatch(markup, /href="\/change-password"/u);
        assert.match(markup, /Amigos/u);
        assert.match(markup, /bob@example\.com/u);
        assert.match(markup, /Te ha añadido a su lista de amigos/u);
        assert.match(markup, /Dejar de ser amigo/u);
        assert.match(markup, /friend-search-dialog/u);
        assert.match(markup, /carol@example\.com/u);
        assert.match(markup, /Hacer amigo/u);
    });

    test('routes friend search and add/remove actions through the user service', async () => {
        const app = Object.assign(Object.create(McUsersApp.prototype), {
            busy: false,
            error: '',
            notice: '',
            friendSearchResults: [],
            friends: [],
        });
        const requests = [];
        app.request = async (endpoint, options = {}) => {
            requests.push({endpoint, options});
            return endpoint.startsWith('/users/search?') ?
                {users: [{
                    id: 'user-1',
                    name: 'Bob',
                    email: 'bob@example.com',
                    isFriend: false,
                }]} :
                {friends: [{
                    id: 'user-1',
                    name: 'Bob',
                    email: 'bob@example.com',
                    isFriendOf: false,
                }]};
        };

        await app.handlePageSubmit({
            detail: {action: 'searchFriends', query: 'bob@example.com'},
        });
        assert.deepEqual(requests[0], {
            endpoint: '/users/search?query=bob%40example.com',
            options: {},
        });
        assert.equal(app.friendSearchCompleted, true);

        await app.handlePageSubmit({
            detail: {action: 'addFriend', friendId: 'user-1'},
        });
        assert.deepEqual(requests[1], {
            endpoint: '/friends/user-1',
            options: {method: 'POST'},
        });
        assert.equal(app.friendSearchResults[0].isFriend, true);

        await app.handlePageSubmit({
            detail: {action: 'removeFriend', friendId: 'user-1'},
        });
        assert.deepEqual(requests[2], {
            endpoint: '/friends/user-1',
            options: {method: 'DELETE'},
        });
        assert.equal(app.friendSearchResults[0].isFriend, false);
    });

    test('places password rules under the new password input', () => {
        const pages = [
            [McUserActivatePage, 'Contraseña'],
            [McUserResetPasswordPage, 'Contraseña'],
            [McUserChangePasswordPage, 'Nueva contraseña'],
        ];

        pages.forEach(([Page, newPasswordLabel]) => {
            const page = Object.assign(Object.create(Page.prototype), {
                formState: {
                    email: 'player@example.com',
                    password: '',
                    confirmPassword: '',
                    currentPassword: '',
                    token: 'token',
                },
                user: {email: 'player@example.com'},
                busy: false,
                notice: '',
                error: '',
                showPassword: false,
            });
            const markup = flattenTemplate(page.render());

            assert.ok(
                markup.indexOf(`label="${newPasswordLabel}"`) <
                    markup.indexOf('class="password-guidance"') &&
                    markup.indexOf('class="password-guidance"') <
                    markup.indexOf('label="Confirmar contraseña"'),
            );
        });
    });

    test('uses the shared purple theme and right-aligns stacked login links', () => {
        assert.match(
            userPageStyles.cssText,
            /--md-filled-button-container-color:\s*var\(--mc-color-primary, #6750a4\)/u,
        );
        assert.match(
            userPageStyles.cssText,
            /\.links\s*\{[^}]*align-items:\s*center;[^}]*justify-content:\s*space-between;/su,
        );
        assert.match(
            userPageStyles.cssText,
            /\.password-field md-text-button\s*\{[^}]*align-self:\s*flex-start;[^}]*margin-block-start:\s*8px;/su,
        );
        assert.doesNotMatch(userPageStyles.cssText, /#174b84|#2764ae/u);
    });

    test('accepts 10–128 code units with at least three required character groups', () => {
        const app = Object.create(McUsersApp.prototype);

        assert.equal(app.isPasswordValid('Abcdef123!'), true);
        assert.equal(app.isPasswordValid('Password 9'), true);
    });

    test('rejects short passwords, too few character groups, and lengths above 128', () => {
        const app = Object.create(McUsersApp.prototype);

        assert.equal(app.isPasswordValid('Abc123!'), false);
        assert.equal(app.isPasswordValid('abcdefghij'), false);
        assert.equal(app.isPasswordValid(`A1!${'a'.repeat(126)}`), false);
    });

    test('requires a valid password and matching confirmation', () => {
        const app = Object.assign(Object.create(McUsersApp.prototype), {
            password: 'Abcdef123!',
            confirmPassword: 'Abcdef123!',
        });

        assert.doesNotThrow(() => app.assertPasswordConfirmation());
        app.confirmPassword = 'Abcdef123?';
        assert.throws(() => app.assertPasswordConfirmation(), /no coinciden/);
        app.password = 'abc';
        assert.throws(() => app.assertPasswordConfirmation(), /10 y 128/);
    });
});
