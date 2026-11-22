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
const {McPlayer} = await import(
    '../src/components/match/mc-player/mc-player.js'
);
const {McScenario} = await import(
    '../src/components/match/mc-scenario/mc-scenario.js'
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
    const events = [];
    const page = Object.assign(Object.create(McMatchPage.prototype), {
        apiPlayer: {
            async resolveAbility(...params) {
                requests.push(params);
            },
        },
        deckTargetSelection: null,
        deckTargetDialogIds: [],
        deckTargetDialogPlayerId: '',
        deckTargetDocumentClickHandler: null,
        deckTargetDocumentClickListenerAttached: false,
        match: {
            phase: 'players',
            currentTurnPlayer: 'Jessica Drew',
            actionRequest: null,
            scenario: {deck: scenarioDeck},
            players,
        },
        player: 'Jessica Drew',
        dispatchEvent(event) {
            events.push(event);
        },
    });

    return {page, requests, events};
};

const flushMicrotasks = () => new Promise(resolve => queueMicrotask(resolve));
const findTemplates = (root, marker) => {
    const pending = [root];
    const templates = [];

    while (pending.length) {
        const value = pending.pop();
        if (Array.isArray(value)) {
            pending.push(...value);
        } else if (value?.strings && value?.values) {
            if (value.strings.join('').includes(marker)) {
                templates.push(value);
            }
            pending.push(...value.values);
        }
    }

    return templates;
};
const getTemplateBinding = (template, property) => {
    const index = template.strings.findIndex(part =>
        part.endsWith(`${property}="`)
    );

    return index === -1 ? undefined : template.values[index];
};

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
            player: 'Jessica Drew',
            initiatingPlayer: 'Jessica Drew',
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

    test('forwards a table deck choice to the pending target dialog', async () => {
        const {page, requests, events} = createPage({
            scenarioDeck: {id: 'scenario-deck', cards: [{}]},
            players: [{deck: {id: 'player-deck-Jessica Drew', cards: [{}]}}],
        });
        page.deckTargetDialogIds = ['scenario-deck'];
        page.deckTargetDialogPlayerId = 'Jessica Drew';

        await page.handleDeckTargetSelect({
            detail: {deckId: 'scenario-deck'},
            stopPropagation() {},
        });

        const rendered = page.render();
        const targetIdsIndex = rendered.strings.findIndex(part =>
            part.endsWith('.deckSelectionTargetIds="')
        );

        assert.deepEqual(rendered.values[targetIdsIndex], ['scenario-deck']);
        assert.deepEqual(requests, []);
        assert.equal(events.at(-1).type, 'dialog-deck-target-select');
        assert.deepEqual(events.at(-1).detail, {deckId: 'scenario-deck'});
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

    test('shows target eyes on player and scenario auxiliary decks', () => {
        const playerDeck = {
            id: 'player-extra-deck',
            name: 'Mazo auxiliar del jugador',
            cards: [{}],
        };
        const player = Object.assign(Object.create(McPlayer.prototype), {
            player: {extraDecks: {[playerDeck.id]: playerDeck}},
            deckSelectionTargetIds: [playerDeck.id],
        });
        const playerDeckTemplate = findTemplates(
            player.renderExtraDecks(),
            '<mc-deck'
        )[0];

        assert.equal(getTemplateBinding(playerDeckTemplate, '.targetId'), playerDeck.id);
        assert.equal(getTemplateBinding(playerDeckTemplate, '.targetSelectable'), true);

        const scenarioDeck = {
            id: 'scenario-extra-deck',
            name: 'Mazo auxiliar del escenario',
            cards: [{}],
        };
        const scenario = Object.assign(Object.create(McScenario.prototype), {
            scenario: {extraDecks: {[scenarioDeck.id]: scenarioDeck}},
            deckSelectionTargetIds: [scenarioDeck.id],
        });
        const scenarioDeckTemplate = findTemplates(
            scenario.renderExtraDecks(),
            '<mc-deck'
        )[0];

        assert.equal(
            getTemplateBinding(scenarioDeckTemplate, '.targetId'),
            scenarioDeck.id
        );
        assert.equal(
            getTemplateBinding(scenarioDeckTemplate, '.targetSelectable'),
            true
        );
    });

    test('shows target eyes on auxiliary decks of other players', () => {
        const extraDeck = {
            id: 'other-player-extra-deck',
            name: 'Mazo auxiliar',
            cards: [{}],
        };
        const currentPlayer = {
            id: 'current-player',
            name: 'Jugador actual',
            deck: {id: 'current-deck', cards: [{}]},
        };
        const otherPlayer = {
            id: 'other-player',
            name: 'Otro jugador',
            deck: {id: 'other-deck', cards: [{}]},
            extraDecks: {[extraDeck.id]: extraDeck},
        };
        const match = Object.assign(Object.create(MatchComponent.prototype), {
            deckSelectionTargetIds: [extraDeck.id],
            match: {players: [currentPlayer, otherPlayer]},
            player: currentPlayer,
        });
        const deckTemplates = findTemplates(
            match.renderOtherPlayerDiscards(),
            '<mc-deck'
        );
        const extraDeckTemplate = deckTemplates.find(template =>
            getTemplateBinding(template, '.targetId') === extraDeck.id
        );

        assert.ok(extraDeckTemplate);
        assert.equal(
            getTemplateBinding(extraDeckTemplate, '.targetSelectable'),
            true
        );
    });

    test('allows only selected deck eyes while a pending choice pauses another phase', () => {
        const player = {
            id: 'Jessica Drew',
            userId: 'local-account',
        };
        const events = [];
        const match = Object.assign(Object.create(MatchComponent.prototype), {
            deckSelectionTargetIds: ['player-deck-Jessica Drew'],
            deckSelectionPlayerId: player.id,
            match: {
                phase: 'villain',
                players: [player],
            },
            player,
            interactive: false,
            tableConsultationMode: false,
            dispatchEvent(event) {
                events.push(event);
            },
        });
        const selectedDeckEvent = {
            type: 'deck-target-select',
            detail: {deckId: 'player-deck-Jessica Drew'},
            stopPropagation() {},
        };

        match.handlePlayerBoardInteraction(selectedDeckEvent, player);

        assert.equal(events.at(-1).type, 'deck-target-select');
        assert.equal(events.at(-1).detail.playerId, player.id);

        let selectedTargetBlocked = false;
        match.guardBoardInteraction({
            type: 'deck-target-select',
            detail: {
                deckId: 'player-deck-Jessica Drew',
                playerId: player.id,
            },
            stopPropagation() {
                selectedTargetBlocked = true;
            },
        });

        assert.equal(selectedTargetBlocked, false);

        let invalidTargetBlocked = false;
        match.guardBoardInteraction({
            type: 'deck-target-select',
            detail: {deckId: 'unavailable-deck'},
            stopPropagation() {
                invalidTargetBlocked = true;
            },
        });

        assert.equal(invalidTargetBlocked, true);
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
            interactive: true,
            player,
        });
        const template = match.render();
        const handTemplate = template.values.find(value =>
            value?.strings?.join('').includes('<mc-hand')
        );
        const handIndex = template.values.indexOf(handTemplate);

        assert.ok(handTemplate);
        assert.equal(handTemplate.values[0], player.hand);
        assert.match(template.strings[handIndex], /<\/div>\s*$/u);
        assert.ok(handIndex < template.values.length);
    });
});
