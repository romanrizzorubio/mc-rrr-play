import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

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

const {McRevealCardsDialog} = await import(
    '../src/components/dialog/mc-reveal-cards-dialog/mc-reveal-cards-dialog.js'
);
const {HandComponent: McCardList} = await import(
    '../src/components/cards/mc-card-list/mc-card-list.js'
);

describe('McRevealCardsDialog selectable cards', () => {
    test('enables card clicks when the dialog marks its cards selectable', () => {
        const dialog = Object.assign(Object.create(McRevealCardsDialog.prototype), {
            data: {
                cards: [{id: 'encounter-1'}],
                selectable: true,
            },
        });

        assert.equal(dialog.renderContent().values[4], true);
    });

    test('returns a selected card from an interruptible batch', () => {
        const card = {id: 'encounter-1'};
        let responseCount = 0;
        const dialog = Object.assign(Object.create(McRevealCardsDialog.prototype), {
            data: {selectable: true},
            viewOnly: false,
            _response: {},
            sendResponse() {
                responseCount++;
            },
        });

        dialog.handleSelectCard({detail: {card}});

        assert.deepEqual(dialog._response, {selected: card});
        assert.equal(responseCount, 1);
    });

    test('keeps informational reveal cards non-selectable', () => {
        let responseCount = 0;
        const dialog = Object.assign(Object.create(McRevealCardsDialog.prototype), {
            data: {selectable: false},
            viewOnly: false,
            _response: {},
            sendResponse() {
                responseCount++;
            },
        });

        dialog.handleSelectCard({detail: {card: {id: 'encounter-1'}}});

        assert.equal(dialog._response.selected, undefined);
        assert.equal(responseCount, 0);
    });

    test('renders card information above horizontal plan cards', () => {
        const card = {
            id: 'collected-scheme',
            isSideScheme: true,
            displayInfo: [{label: '', value: 'El Coleccionista'}],
        };
        const dialog = Object.assign(Object.create(McRevealCardsDialog.prototype), {
            data: {
                cards: [card],
                rotatePlanCards: true,
                selectable: false,
            },
        });

        const template = dialog.renderContent();
        const cardGroup = template.values[0][0];
        const cardInfo = cardGroup.values[0];
        const cardList = cardGroup.values[1];
        const rotateIndex = cardList.strings.findIndex(part =>
            part.includes('.rotatePlanCards='));
        const cardListComponent = Object.assign(
            Object.create(McCardList.prototype),
            {
                size: 'm',
                marked: [],
                disabledCards: [],
                showBasicStats: false,
                showAcquiredTraits: false,
                showLife: false,
                showDamage: false,
                showThreat: false,
                showGeneric: false,
                emphasizedStats: [],
                highlightPlayable: false,
                rotatePlanCards: cardList.values[rotateIndex],
                allowPlayCardDrag: false,
                selectOnClick: false,
                player: null,
                basicActivationType: '',
                dragActivation: null,
                dragPlayCard: null,
                dragResourcePayment: null,
            }
        );
        const renderedCard = cardListComponent.renderCard(card, 0);
        const horizontalIndex = renderedCard.strings.findIndex(part =>
            part.includes('?horizontal='));
        const rotatedIndex = renderedCard.strings.findIndex(part =>
            part.includes('.rotated='));

        assert.match(template.strings.join(''), /revealed-cards-with-info/);
        assert.match(cardGroup.strings.join(''), /revealed-card-with-info/);
        assert.equal(cardInfo.values[0][0].values[1], 'El Coleccionista');
        assert.deepEqual(cardList.values[0], [card]);
        assert.equal(cardList.values[rotateIndex], true);
        assert.equal(renderedCard.values[horizontalIndex], true);
        assert.equal(renderedCard.values[rotatedIndex], true);
    });
});
