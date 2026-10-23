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
const {HandComponent: McCardList} = await import(
    '../src/components/cards/mc-card-list/mc-card-list.js'
);
const {McSelectTargetDialog} = await import(
    '../src/components/dialog/mc-select-target-dialog/mc-select-target-dialog.js'
);

describe('card selection dialogs', () => {
    test('target selection dialog configures cards to select on click', () => {
        const dialog = Object.assign(
            Object.create(McSelectTargetDialog.prototype),
            {
                data: {
                    cards: [],
                    showCounters: true,
                    showLife: true,
                    showDamage: false,
                },
                _marked: [],
            }
        );
        const template = dialog.renderContent();
        const selectOnClickBinding = template.strings.findIndex(part =>
            part.includes('.selectOnClick="'));

        assert.notEqual(selectOnClickBinding, -1);
        assert.equal(template.values[selectOnClickBinding], true);
    });

    test('card list passes selection mode to its cards', () => {
        const cardList = Object.assign(
            Object.create(McCardList.prototype),
            {
                size: 'm',
                marked: [],
                disabledCards: [],
                showBasicStats: false,
                showAcquiredTraits: false,
                showMenuAbilities: false,
                showLife: false,
                showDamage: false,
                showThreat: false,
                showGeneric: false,
                emphasizedStats: [],
                showExhausted: false,
                highlightPlayable: false,
                rotatePlanCards: false,
                allowPlayCardDrag: false,
                selectOnClick: true,
                player: null,
                basicActivationType: '',
                dragActivation: null,
                dragPlayCard: null,
                dragResourcePayment: null,
            }
        );
        const template = cardList.renderCard({
            id: 'scheme-1',
            name: 'En el punto de mira',
            image: 'side-scheme.png',
            isSideScheme: true,
            tuckedCards: [{name: 'Pájaro Burlón'}],
        }, 0);
        const selectOnClickBinding = template.strings.findIndex(part =>
            part.includes('.selectOnClick="'));

        assert.notEqual(selectOnClickBinding, -1);
        assert.equal(template.values[selectOnClickBinding], true);
    });

    test('clicking a tucked host in selection mode selects the host', () => {
        const events = [];
        const host = {
            id: 'scheme-1',
            name: 'En el punto de mira',
            tuckedCards: [{name: 'Pájaro Burlón'}],
        };
        const card = Object.assign(Object.create(CardComponent.prototype), {
            basicActivation: undefined,
            card: host,
            clickDisabled: false,
            doubleClickOption: '',
            menuOptions: [],
            selectOnClick: true,
            tuckedCards: host.tuckedCards,
            dispatchEvent(event) {
                events.push(event);
            },
        });

        card.handleClick({detail: 1});

        assert.equal(events.length, 1);
        assert.equal(events[0].type, 'card-click');
        assert.deepEqual(events[0].detail, {card: host});
    });

    test('clicking a tucked host outside selection mode opens its tucked cards', () => {
        const events = [];
        const host = {
            id: 'scheme-1',
            name: 'En el punto de mira',
            tuckedCards: [{name: 'Pájaro Burlón'}],
        };
        const card = Object.assign(Object.create(CardComponent.prototype), {
            basicActivation: undefined,
            card: host,
            clickDisabled: false,
            doubleClickOption: '',
            menuOptions: [],
            selectOnClick: false,
            tuckedCards: host.tuckedCards,
            dispatchEvent(event) {
                events.push(event);
            },
            handleViewTuckedCards() {
                events.push({type: 'view-tucked-cards'});
            },
        });

        card.handleClick({detail: 1});

        assert.deepEqual(events, [{type: 'view-tucked-cards'}]);
    });
});
