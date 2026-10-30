import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {BACK_CARD_PLAYER} from 'mc-shared';

globalThis.HTMLElement = class {};
globalThis.window = {
    mcStaticRemote: {
        getAssetUrl: path => path,
    },
    customElements: {
        define() {},
    },
};
globalThis.CustomEvent = class {
    constructor(type, options = {}) {
        this.type = type;
        Object.assign(this, options);
    }
};

const {HandComponent: McCardList} = await import(
    '../src/components/cards/mc-card-list/mc-card-list.js'
);

describe('Player target display', () => {
    const createList = () =>
        Object.assign(Object.create(McCardList.prototype), {
            size: 'm',
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
            showExhausted: false,
        });

    test('shows the player name with a neutral card back when no hero is provided', () => {
        const list = createList();
        const template = list.renderCard({
            id: 'player-hawkeye',
            isPlayer: true,
            name: 'Hawkeye',
        }, 0);
        const imageBinding = template.strings.findIndex(part =>
            part.includes('image='));
        const hideNameBinding = template.strings.findIndex(part =>
            part.includes('.hideName='));

        assert.equal(template.values[imageBinding], BACK_CARD_PLAYER);
        assert.equal(template.values[hideNameBinding], false);
    });

    test('shows each eligible superhero image and selects its player ID', () => {
        const list = createList();
        list.cards = [
            {
                id: 'captain-player',
                isPlayer: true,
                name: 'Steve Rogers',
                image: 'heroes/captain-america/03001b.png',
                showPlayerHero: true,
                attached: [],
                faceDown: [],
                tuckedCards: [],
                statusCards: {},
            },
            {
                id: 'marvel-player',
                isPlayer: true,
                name: 'Carol Danvers',
                image: 'heroes/captain-marvel/01010b.png',
                showPlayerHero: true,
                attached: [],
                faceDown: [],
                tuckedCards: [],
                statusCards: {},
            },
        ];
        const selections = [];
        list.dispatchEvent = event => selections.push(event);

        list.cards.forEach((card, index) => {
            const template = list.renderCard(card, index);
            const imageBinding = template.strings.findIndex(part =>
                part.includes('image='));
            const cardBinding = template.strings.findIndex(part =>
                part.includes('.card='));
            const attachedBinding = template.strings.findIndex(part =>
                part.includes('.attached='));
            assert.equal(template.values[imageBinding], card.image);
            assert.strictEqual(template.values[cardBinding], card);
            assert.deepEqual(template.values[attachedBinding], []);

            list.handleClick(index)();
            assert.equal(selections[index].type, 'card-list-select');
            assert.strictEqual(selections[index].detail.card, card);
            assert.equal(selections[index].detail.card.id, card.id);
        });
    });
});
