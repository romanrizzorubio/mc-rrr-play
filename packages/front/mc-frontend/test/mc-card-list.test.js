import assert from 'node:assert/strict';
import {test} from 'node:test';
import {PLACE_DISCARD_PILE} from 'mc-shared';

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
const {CardComponent} = await import(
    '../src/components/cards/mc-card/mc-card.js'
);
const {ICON_EYE} = await import(
    '../src/components/common/mc-icon/mc-icon.js'
);
const {DECK_TYPES, DeckComponent} = await import(
    '../src/components/panels/mc-deck/mc-deck.js'
);
const {McRevealCardsDialog} = await import(
    '../src/components/dialog/mc-reveal-cards-dialog/mc-reveal-cards-dialog.js'
);

const renderCardClass = (playable, disabledCards = []) => {
    const list = Object.assign(Object.create(McCardList.prototype), {
        size: 'm',
        marked: [],
        disabledCards,
        showBasicStats: false,
        showAcquiredTraits: false,
        showLife: false,
        showDamage: false,
        showThreat: false,
        showGeneric: false,
        highlightPlayable: true,
        rotatePlanCards: false,
        showExhausted: false,
    });
    const template = list.renderCard({
        name: 'Example card',
        image: 'example-card',
        playable,
    }, 0);

    return template.values[0];
};

test('highlights only explicitly playable cards', () => {
    assert.equal(renderCardClass(true), 'playable');
    assert.equal(renderCardClass(false), '');
    assert.equal(renderCardClass(undefined), '');
});

test('passes generic counters to cards when generic counters are displayed', () => {
    const counters = 3;
    const list = Object.assign(Object.create(McCardList.prototype), {
        size: 's',
        marked: [],
        disabledCards: [],
        showBasicStats: true,
        showAcquiredTraits: false,
        showLife: false,
        showDamage: false,
        showThreat: false,
        showGeneric: true,
        highlightPlayable: false,
        rotatePlanCards: false,
        showExhausted: false,
        player: null,
        basicActivationType: '',
        dragActivation: null,
    });
    const template = list.renderCard({
        name: 'Countered accessory',
        image: 'countered-accessory.png',
        counters,
    }, 0);
    const genericBinding = template.strings.findIndex(part =>
        part.includes('.generic=')
    );
    const showGenericBinding = template.strings.findIndex(part =>
        part.includes('.showGeneric=')
    );

    assert.equal(template.values[genericBinding], counters);
    assert.equal(template.values[showGenericBinding], true);
});

test('does not highlight a card while it is temporarily disabled', () => {
    assert.equal(renderCardClass(true, [0]), 'disabled');
});

test('highlights the owner player discard pile when it contains a playable card', () => {
    const deck = Object.assign(Object.create(DeckComponent.prototype), {
        type: DECK_TYPES.PLAYER,
        discard: [
            {image: 'mandibulas', playFrom: [PLACE_DISCARD_PILE]},
            {image: 'ordinary-card', playFrom: []},
        ],
        discardLabel: 'Descarte de Bruno',
        highlightPlayableDiscard: true,
    });

    assert.equal(deck.renderDiscard().values[0], 'playable');
});

test('does not highlight other players or cards that cannot be played from discard', () => {
    const otherPlayersDeck = Object.assign(Object.create(DeckComponent.prototype), {
        type: DECK_TYPES.PLAYER,
        discard: [{
            image: 'mandibulas',
            playFrom: [PLACE_DISCARD_PILE],
        }],
        discardLabel: 'Descarte de otra persona',
        highlightPlayableDiscard: false,
    });
    const ineligibleCardDeck = Object.assign(Object.create(DeckComponent.prototype), {
        type: DECK_TYPES.PLAYER,
        discard: [{image: 'ordinary-card', playFrom: []}],
        discardLabel: 'Descarte de Bruno',
        highlightPlayableDiscard: true,
    });

    assert.equal(otherPlayersDeck.renderDiscard().values[0], '');
    assert.equal(ineligibleCardDeck.renderDiscard().values[0], '');
});

test('shows an eye on a deck with known cards and opens their list', () => {
    const knownCards = [{id: 'known-card', name: 'Carta conocida'}];
    const deck = Object.assign(Object.create(DeckComponent.prototype), {
        cards: [{id: 'top-card'}],
        knownCards,
        type: DECK_TYPES.PLAYER,
        deckName: 'Bruno',
    });
    const template = deck.renderDeck();

    assert.ok(template.values.some(value =>
        value?.strings?.join('').includes('known-cards-button')
    ));

    deck.dispatchEvent = event => {
        deck.dispatchedEvent = event;
    };
    deck.handleViewKnownCards();

    assert.equal(deck.dispatchedEvent.type, 'view-known-cards');
    assert.ok(template.values.some(value => value?.values?.includes(ICON_EYE)));
    assert.equal(deck.dispatchedEvent.detail.title, 'Cartas vistas del mazo de Bruno');
    assert.deepEqual(deck.dispatchedEvent.detail.cards, knownCards);
});

test('does not show the known-cards eye when the deck has no viewed cards', () => {
    const deck = Object.assign(Object.create(DeckComponent.prototype), {
        cards: [{id: 'top-card'}],
        knownCards: [],
        type: DECK_TYPES.ENCOUNTER,
    });

    assert.ok(!deck.renderDeck().values.some(value =>
        value?.strings?.join('').includes('known-cards-button')
    ));
});

test('renders an auxiliary scenario deck without its own discard pile', () => {
    const deck = Object.assign(Object.create(DeckComponent.prototype), {
        cards: [],
        deckName: 'Armas experimentales',
        knownCards: [],
        showDeck: true,
        showDiscard: false,
        deckNamePosition: 'top',
    });
    const template = deck.render();

    let renderedDiscardPile = false;
    deck.renderDiscard = () => {
        renderedDiscardPile = true;
    };
    deck.render();

    assert.equal(renderedDiscardPile, false);
    assert.equal(template.values[1], '');
    const deckPanelTemplate = template.values[3];
    const deckTitleTemplate = deckPanelTemplate.values.find(value =>
        value?.strings?.join('').includes('deck-name-top')
    );
    assert.ok(deckTitleTemplate);
    assert.equal(deckTitleTemplate.values[0], 'Armas experimentales');
    assert.equal(deckPanelTemplate.values[0], 'deck-panel-titled');
    assert.equal(template.values[4], '');
});

test('hides a player deck name without removing its accessible deck label', () => {
    const deck = Object.assign(Object.create(DeckComponent.prototype), {
        deckName: 'Peter Parker',
        deckNamePosition: 'bottom',
        showDeckName: false,
        showDeck: true,
        showDiscard: false,
        cards: [],
        knownCards: [],
    });
    const template = deck.render();

    assert.equal(template.values[0], 'Peter Parker');
    assert.equal(template.values[4], '');
});

test('highlights discard cards that can be played from that discard', () => {
    const dialog = Object.assign(Object.create(McRevealCardsDialog.prototype), {
        data: {
            cards: [
                {id: 'mandibulas', playFrom: [PLACE_DISCARD_PILE]},
                {id: 'ordinary-card', playFrom: []},
            ],
            rotatePlanCards: true,
            playFromPlace: PLACE_DISCARD_PILE,
        },
        _marked: [],
    });
    const template = dialog.renderContent();

    assert.equal(template.values[0][0].playable, true);
    assert.equal(template.values[0][1].playable, false);
    assert.deepEqual(template.values[1], [1]);
    assert.equal(template.values[2], true);
});

test('applies a diffuse yellow highlight only to the card image', () => {
    const styles = CardComponent.styles.cssText;

    assert.match(
        styles,
        /:host\(\.playable\) \.card-front > mc-card-image/
    );
    assert.match(styles, /drop-shadow\(0 0 4px rgba\(255, 235, 59, 0\.95\)\)/);
    assert.doesNotMatch(styles, /:host\(\.playable\).*outline/s);
});

test('uses the same diffuse yellow highlight for a playable discard pile', () => {
    const styles = DeckComponent.styles.cssText;

    assert.match(styles, /\.discard-button\.playable mc-card-image/);
    assert.match(styles, /drop-shadow\(0 0 4px rgba\(255, 235, 59, 0\.95\)\)/);
    assert.doesNotMatch(styles, /\.discard-button\.playable[^}]*brightness/);
});

test('matches the auxiliary deck title size to scheme and villain titles', () => {
    const cardTitleSize = CardComponent.styles.cssText
        .match(/\.name\s*\{[^}]*font-size:\s*([^;]+);/s)?.[1];
    const villainTitleSize = CardComponent.styles.cssText
        .match(/\.stage-name\s*\{[^}]*font-size:\s*([^;]+);/s)?.[1];
    const deckTitleSize = DeckComponent.styles.cssText
        .match(/\.deck-name-top\s*\{[^}]*font-size:\s*([^;]+);/s)?.[1];

    assert.equal(deckTitleSize, cardTitleSize);
    assert.equal(deckTitleSize, villainTitleSize);
    assert.match(
        DeckComponent.styles.cssText,
        /\.deck-panel-titled\s*\{[^}]*align-items:\s*center/s
    );
    assert.match(
        DeckComponent.styles.cssText,
        /\.deck-name-top\s*\{[^}]*width:\s*100px/s
    );
});

test('adds a tucked-card viewer option alongside available card actions', () => {
    const list = Object.assign(Object.create(McCardList.prototype), {
        showMenuAbilities: true,
    });
    const options = list.getMenuOptions({
        abilities: [
            {isAction: true, name: 'Usar apoyo'},
        ],
        tuckedCards: [{id: 'tucked-card'}],
    });

    assert.deepEqual(options.map(({text}) => text), [
        'Usar apoyo',
        'Ver cartas metidas debajo',
    ]);
});

test('opens the tucked-card viewer directly when there are no other actions', () => {
    const card = Object.assign(Object.create(CardComponent.prototype), {
        name: 'Bruno',
        image: 'bruno.png',
        menuOptions: [],
        tuckedCards: [{id: 'tucked-card'}],
        dispatchEvent(event) {
            this.dispatchedEvent = event;
        },
    });

    card.handleClick();

    assert.equal(card.dispatchedEvent.type, 'view-tucked-cards');
    assert.equal(card.dispatchedEvent.detail.card.name, 'Bruno');
    assert.deepEqual(
        card.dispatchedEvent.detail.cards,
        card.tuckedCards
    );
});

test('opens the tucked-card viewer directly when all other menu actions are disabled', () => {
    const card = Object.assign(Object.create(CardComponent.prototype), {
        menuOptions: [
            {id: 'ability-0', disable: true},
            {id: 'view-tucked-cards'},
        ],
        tuckedCards: [{id: 'tucked-card'}],
        dispatchEvent(event) {
            this.dispatchedEvent = event;
        },
    });

    card.handleClick();

    assert.equal(card.dispatchedEvent.type, 'view-tucked-cards');
});

test('forwards the full tucked-card list from a card list', () => {
    const card = {name: 'Bruno', tuckedCards: [{id: 'tucked-card'}]};
    const list = Object.assign(Object.create(McCardList.prototype), {
        cards: [card],
        dispatchEvent(event) {
            this.dispatchedEvent = event;
        },
    });

    list.handleViewTuckedCards(0)({
        stopPropagation() {},
    });

    assert.equal(list.dispatchedEvent.type, 'view-tucked-cards');
    assert.equal(list.dispatchedEvent.detail.card, card);
    assert.deepEqual(list.dispatchedEvent.detail.cards, card.tuckedCards);
});
