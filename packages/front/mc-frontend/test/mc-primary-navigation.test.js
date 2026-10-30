import assert from 'node:assert/strict';
import {describe, test} from 'node:test';
import {PartType} from 'lit/directive.js';

globalThis.HTMLElement ??= class {};
globalThis.window ??= {
    customElements: {
        get() {
            return undefined;
        },
        define() {},
    },
};

const {McPrimaryNavigation} = await import(
    '../src/components/core/mc-primary-navigation/mc-primary-navigation.js'
);

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

describe('primary navigation', () => {
    test('guests see only Mazos and cannot navigate to Partidas', () => {
        const navigation = Object.assign(
            Object.create(McPrimaryNavigation.prototype),
            {activeRoute: 'login', user: null},
        );
        const markup = flattenTemplate(navigation.render());
        const navigationEvents = [];
        navigation.dispatchEvent = event => navigationEvents.push(event);

        assert.match(markup, /Mazos/u);
        assert.doesNotMatch(markup, /Partidas/u);
        assert.equal(navigation.activeTabIndex, -1);

        navigation.handleTabClick({preventDefault() {}}, 'decks');

        assert.equal(navigationEvents[0].detail.route, 'decks');
    });

    test('signed-in users can switch between Partidas and Mazos', () => {
        const navigation = Object.assign(
            Object.create(McPrimaryNavigation.prototype),
            {activeRoute: 'matches', user: {id: 'user-1'}},
        );
        const navigationEvents = [];
        navigation.dispatchEvent = event => navigationEvents.push(event);

        assert.match(flattenTemplate(navigation.render()), /Partidas/u);
        assert.equal(navigation.activeTabIndex, 0);

        navigation.handleTabClick({preventDefault() {}}, 'decks');

        assert.equal(navigationEvents[0].detail.route, 'decks');
    });

    test('account pages render navigation with no selected tab', () => {
        const navigation = Object.assign(
            Object.create(McPrimaryNavigation.prototype),
            {activeRoute: 'profile', user: {id: 'user-1'}},
        );
        const navigationEvents = [];
        navigation.dispatchEvent = event => navigationEvents.push(event);

        assert.equal(navigation.activeTabIndex, -1);
        const markup = flattenTemplate(navigation.render());
        assert.match(markup, /class="unselected-tabs"/u);
        assert.doesNotMatch(markup, /<md-tabs/u);
        const activeValues = [];
        const collectActiveValues = template => {
            for (const value of template.values || []) {
                if (value?._$litDirective$) {
                    activeValues.push(...value.values);
                } else if (value?.values) {
                    collectActiveValues(value);
                }
            }
        };
        collectActiveValues(navigation.render());
        assert.deepEqual(activeValues, [false, false]);
        assert.match(markup, /Partidas/u);
        assert.match(markup, /Mazos/u);

        navigation.handleTabNavigation('matches');

        assert.equal(navigationEvents[0].detail.route, 'matches');
    });

    test('only administrators see and can open the Usuarios tab', () => {
        const adminNavigation = Object.assign(
            Object.create(McPrimaryNavigation.prototype),
            {activeRoute: 'user-detail', user: {id: 'admin-1', isAdmin: true}},
        );
        const adminEvents = [];
        adminNavigation.dispatchEvent = event => adminEvents.push(event);

        assert.match(flattenTemplate(adminNavigation.render()), /Usuarios/u);
        assert.equal(adminNavigation.activeTabIndex, 2);
        adminNavigation.handleTabClick({preventDefault() {}}, 'users');
        assert.equal(adminEvents[0].detail.route, 'users');

        const regularNavigation = Object.assign(
            Object.create(McPrimaryNavigation.prototype),
            {activeRoute: 'matches', user: {id: 'user-1', isAdmin: false}},
        );
        regularNavigation.dispatchEvent = event => adminEvents.push(event);
        assert.doesNotMatch(flattenTemplate(regularNavigation.render()), /Usuarios/u);
        regularNavigation.handleTabClick({preventDefault() {}}, 'users');
        assert.equal(adminEvents.length, 1);
    });

    test('each page selects only its own navigation section across account changes', () => {
        const navigation = Object.assign(Object.create(McPrimaryNavigation.prototype), {});
        for (const user of [null, {id: 'user'}, {id: 'admin', isAdmin: true}]) {
            navigation.user = user;
            for (const route of [
                'decks', 'decks-create', 'decks-edit-new', 'decks-edit',
                'matches', 'create-match', 'match-lobby', 'users', 'user-detail',
                'login', 'register', 'profile', 'change-password', 'not-found',
            ]) {
                navigation.activeRoute = route;
                const expected = route.startsWith('decks') ? (user ? 1 : 0) :
                    ['matches', 'create-match', 'match-lobby'].includes(route) && user ? 0 :
                    ['users', 'user-detail'].includes(route) && user?.isAdmin ? 2 : -1;
                assert.equal(navigation.activeTabIndex, expected, `${route} with ${user?.id || 'guest'}`);
                if (expected === -1) {
                    assert.doesNotMatch(flattenTemplate(navigation.render()), /<md-tabs/u);
                }
            }
        }
    });

    test('tab clicks navigate once and prevent Material from independently selecting a tab', () => {
        const navigation = Object.assign(Object.create(McPrimaryNavigation.prototype), {
            activeRoute: 'matches', user: {id: 'user'},
        });
        const events = [];
        let prevented = false;
        navigation.dispatchEvent = event => events.push(event);
        navigation.handleTabClick({preventDefault: () => { prevented = true; }}, 'decks');
        assert.equal(prevented, true);
        assert.equal(events.length, 1);
        assert.equal(events[0].detail.route, 'decks');
        assert.equal(navigation.activeTabIndex, 0);
        navigation.activeRoute = 'decks';
        assert.equal(navigation.activeTabIndex, 1);
        assert.doesNotMatch(flattenTemplate(navigation.render()), /@change=/u);
    });

    test('the live route binding repairs stale Material selection on a reused tab bar', () => {
        const navigation = Object.assign(Object.create(McPrimaryNavigation.prototype), {
            activeRoute: 'decks-edit', user: {id: 'user'},
        });
        const render = navigation.render();
        const tabBar = render.values.find(value => value?.strings?.some(part =>
            part.includes('.activeTabIndex=')));
        const binding = tabBar.values.find(value => value?._$litDirective$);
        const part = {
            type: PartType.PROPERTY, name: 'activeTabIndex', element: {activeTabIndex: 0},
        };
        const directive = new binding._$litDirective$(part);
        assert.equal(directive.update(part, binding.values), 1);
        part.element.activeTabIndex = 2;
        assert.equal(directive.update(part, binding.values), 1);
        const markup = flattenTemplate(render);
        assert.match(markup, /\.active=/u);
    });
});
