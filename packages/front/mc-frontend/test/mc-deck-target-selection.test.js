import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {ABILITY_ID} from '../src/misc/utils.js';

globalThis.HTMLElement ??= class {};
globalThis.window ??= {
    mcStaticRemote: {
        getAssetUrl: path => path,
    },
    customElements: {
        define() {},
    },
};
globalThis.CustomEvent ??= class {
    constructor(type, options = {}) {
        this.type = type;
        Object.assign(this, options);
    }
};

const {McMatchPage} = await import(
    '../src/pages/mc-match-page/mc-match-page.js'
);
const {ICON_EYE} = await import(
    '../src/components/common/mc-icon/mc-icon.js'
);
const {DECK_TYPES, DeckComponent} = await import(
    '../src/components/panels/mc-deck/mc-deck.js'
);
const {MatchComponent} = await import(
    '../src/components/views/mc-match/mc-match.js'
);

const documentClickListeners = new Set();
globalThis.document ??= {
    addEventListener(type, listener) {
        if (type === 'click') {
            documentClickListeners.add(listener);
        }
    },
    removeEventListener(type, listener) {
        if (type === 'click') {
            documentClickListeners.delete(listener);
        }
    },
};

const createPage = ({scenarioDeck, players}) => {
    const requests = [];
    const page = Object.assign(Object.create(McMatchPage.prototype), {
        apiPlayer: {
            async resolveAbility(...params) {
                requests.push(params);
            },
        },
        deckTargetSelection: null,
        deckTargetDocumentClickHandler: null,
        deckTargetDocumentClickListenerAttached: false,
        match: {
            scenario: {deck: scenarioDeck},
            players,
        },
        player: 'Jessica Drew',
    });

    return {page, requests};
};

const flushMicrotasks = () => new Promise(resolve => queueMicrotask(resolve));

describe('deck target selection', () => {
    test('lets the player choose a legal deck with its eye and resolves against it', async () => {
        const encounterDeck = {id: 'scenario-deck', cards: [{}]};
        const playerDeck = {id: 'player-deck-Jessica Drew', cards: [{}]};
        const otherPlayerDeck = {id: 'player-deck-Peter Parker', cards: [{}]};
        const emptyDeck = {id: 'player-deck-Carol Danvers', cards: []};
        const {page, requests} = createPage({
            scenarioDeck: encounterDeck,
            players: [
                {deck: playerDeck, name: 'Jessica Drew'},
                {deck: otherPlayerDeck, name: 'Peter Parker'},
                {deck: emptyDeck, name: 'Carol Danvers'},
            ],
        });
        const card = {
            id: 'generic-look-action',
            abilities: [{
                targetSelectionMode: 'deck',
                availableTargetIds: [
                    encounterDeck.id,
                    playerDeck.id,
                    otherPlayerDeck.id,
                    emptyDeck.id,
                ],
            }],
        };

        page.handleMenuOption(card)({
            selected: {id: `${ABILITY_ID}0`},
        });
        await flushMicrotasks();

        assert.deepEqual(page.deckTargetSelection, {
            cardId: 'generic-look-action',
            abilityIndex: 0,
            targetIds: [
                encounterDeck.id,
                playerDeck.id,
                otherPlayerDeck.id,
            ],
        });
        assert.deepEqual(requests, []);

        const [outsideClick] = documentClickListeners;
        outsideClick({
            composedPath: () => [{
                hasAttribute: name => name === 'data-deck-target-eye',
            }],
        });
        assert.ok(page.deckTargetSelection);

        await page.handleDeckTargetSelect({
            detail: {deckId: otherPlayerDeck.id},
            stopPropagation() {},
        });

        assert.deepEqual(requests, [[
            'Jessica Drew',
            'generic-look-action',
            0,
            otherPlayerDeck.id,
        ]]);
        assert.equal(page.deckTargetSelection, null);
        assert.equal(documentClickListeners.size, 0);
    });

    test('cancels without resolving when any non-eye location is clicked', async () => {
        const playerDeck = {id: 'player-deck-Jessica Drew', cards: [{}]};
        const {page, requests} = createPage({
            scenarioDeck: {id: 'scenario-deck', cards: [{}]},
            players: [{deck: playerDeck, name: 'Jessica Drew'}],
        });
        const card = {
            id: 'jessica-drew',
            abilities: [{
                targetSelectionMode: 'deck',
                availableTargetIds: [playerDeck.id],
            }],
        };

        page.resolveAbilityOrSelectDeck(card, 0);
        await flushMicrotasks();

        let defaultPrevented = false;
        let propagationStopped = false;
        const [outsideClick] = documentClickListeners;
        outsideClick({
            composedPath: () => [],
            preventDefault() {
                defaultPrevented = true;
            },
            stopPropagation() {
                propagationStopped = true;
            },
        });

        assert.equal(defaultPrevented, true);
        assert.equal(propagationStopped, true);
        assert.equal(page.deckTargetSelection, null);
        assert.equal(requests.length, 0);
        assert.equal(documentClickListeners.size, 0);
    });

    test('resolves a specific deck target without opening the deck chooser', () => {
        const playerDeck = {id: 'player-deck-Jessica Drew', cards: [{}]};
        const {page, requests} = createPage({
            scenarioDeck: {id: 'scenario-deck', cards: [{}]},
            players: [{deck: playerDeck, name: 'Jessica Drew'}],
        });
        const card = {
            id: 'specific-deck-action',
            abilities: [{
                availableTargetIds: [playerDeck.id],
            }],
        };

        page.resolveAbilityOrSelectDeck(card, 0);

        assert.equal(page.deckTargetSelection, null);
        assert.deepEqual(requests, [[
            'Jessica Drew',
            'specific-deck-action',
            0,
        ]]);
    });

    test('shows a prominent eye button only on a selectable deck', () => {
        const deck = Object.assign(Object.create(DeckComponent.prototype), {
            cards: [{}],
            deckName: 'Peter Parker',
            deckNamePosition: 'bottom',
            deckNameSpansPiles: false,
            dragActivation: null,
            dragPlayCard: null,
            knownCards: [],
            showDeckName: true,
            targetId: 'player-deck-Peter Parker',
            targetSelectable: true,
            topCard: null,
            topCardFaceUp: false,
            type: DECK_TYPES.PLAYER,
        });
        const template = deck.renderDeck();
        const eyeButton = template.values.find(value =>
            value?.strings?.join('').includes('deck-target-button')
        );

        assert.ok(eyeButton);
        assert.ok(eyeButton.values.includes(ICON_EYE));

        let selectedEvent;
        deck.dispatchEvent = event => {
            selectedEvent = event;
        };
        deck.handleSelectDeckTarget({
            preventDefault() {},
            stopPropagation() {},
        });

        assert.equal(selectedEvent.type, 'deck-target-select');
        assert.equal(selectedEvent.detail.deckId, deck.targetId);

        deck.targetSelectable = false;
        assert.equal(
            deck.renderDeck().values.some(value =>
                value?.strings?.join('').includes('deck-target-button')
            ),
            false
        );
    });

    test('renders the hand outside the board panel', () => {
        const player = {hand: [{id: 'hand-card'}]};
        const match = Object.assign(Object.create(MatchComponent.prototype), {
            deckSelectionTargetIds: [],
            dragActivation: null,
            dragPlayCard: null,
            dragResourcePayment: null,
            match: null,
            playCardPending: false,
            player,
        });
        const template = match.render();
        const handTemplate = template.values.find(value =>
            value?.strings?.join('').includes('<mc-hand')
        );

        assert.ok(handTemplate);
        assert.equal(handTemplate.values[0], player.hand);
        assert.ok(template.strings[4].includes('</div>'));
    });
});
