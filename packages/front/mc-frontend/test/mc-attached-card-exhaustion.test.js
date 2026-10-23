import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
    mcStaticRemote: {
        getAssetUrl(path) {
            return path;
        },
    },
};
globalThis.CustomEvent = class {
    constructor(type, options = {}) {
        this.type = type;
        Object.assign(this, options);
    }
};

const {CardComponent} = await import(
    '../src/components/cards/mc-card/mc-card.js'
);
const {HandComponent: CardList} = await import(
    '../src/components/cards/mc-card-list/mc-card-list.js'
);

describe('attached card exhaustion', () => {
    test('renders attached cards with exhaustion enabled and rotates exhausted cards', () => {
        const host = Object.assign(Object.create(CardComponent.prototype), {
            attached: [{id: 'aeromoto', exhausted: true}],
            dragActivation: null,
            dragPlayCard: null,
            dragResourcePayment: null,
            size: 'm',
        });
        const attachedTemplate = host.renderAttached();

        assert.ok(attachedTemplate.strings.join('').includes('show-exhausted'));

        const cardList = Object.assign(Object.create(CardList.prototype), {
            size: 's',
            marked: [],
            disabledCards: [],
            showBasicStats: false,
            showAcquiredTraits: false,
            showLife: false,
            showDamage: false,
            showThreat: false,
            showGeneric: false,
            highlightPlayable: false,
            rotatePlanCards: false,
            showExhausted: true,
        });
        const attachedCardTemplate = cardList.renderCard({
            name: 'Aeromoto',
            image: 'aeromoto.png',
            exhausted: true,
        }, 0);
        const exhaustedBinding = attachedCardTemplate.strings.findIndex(part =>
            part.includes('.exhausted='));

        assert.equal(attachedCardTemplate.values[exhaustedBinding], true);
        assert.match(
            CardComponent.styles.cssText,
            /\.exhausted\s*\{[^}]*transform:\s*rotate\(15deg\)/s,
        );
    });
});
