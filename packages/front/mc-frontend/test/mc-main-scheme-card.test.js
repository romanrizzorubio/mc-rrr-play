import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement ??= class {};
globalThis.window ??= {};
globalThis.window.customElements ??= {define() {}};
globalThis.CustomEvent ??= class {
    constructor(type, options = {}) {
        this.type = type;
        Object.assign(this, options);
    }
};

const {MainSchemeCardComponent} = await import(
    '../src/components/cards/schemes/mc-main-scheme-card/mc-main-scheme-card.js'
);

describe('main scheme card actions', () => {
    test('forwards a directly selected menu ability to the match', () => {
        const card = {
            abilities: [{
                disable: false,
                index: 1,
                isAction: true,
                isBasic: false,
                name: 'Agota la Milano',
            }],
            id: 'main-scheme',
        };
        const component = Object.assign(
            Object.create(MainSchemeCardComponent.prototype),
            {
                acceleration: 0,
                attached: [],
                card,
                counters: undefined,
                dragActivation: null,
                dragPlayCard: null,
                dragResourcePayment: null,
                image: 'main-scheme.png',
                name: 'Invasión extraterrestre',
                player: null,
                stage: 1,
                threat: 3,
                value: 0,
            }
        );
        const events = [];
        let propagationStopped = false;
        component.dispatchEvent = event => events.push(event);

        const template = component.render();
        const menuClickBindingIndex = template.strings.findIndex(part =>
            part.includes('@card-menu-click=')
        );

        assert.notEqual(menuClickBindingIndex, -1);
        const handleMenuClick = template.values[menuClickBindingIndex];
        assert.equal(typeof handleMenuClick, 'function');

        handleMenuClick({
            detail: {option: 'ability-1'},
            stopPropagation() {
                propagationStopped = true;
            },
        });

        assert.equal(propagationStopped, true);
        assert.equal(events.length, 1);
        assert.equal(events[0].type, 'ability');
        assert.deepEqual(events[0].detail, {
            card,
            ability: 1,
        });
    });
});
