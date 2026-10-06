import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    DIALOG_ENCOUNTERS_REVEAL,
    TARGET_INITIAL_PLAYER,
    TRAIT_MASTERS_OF_EVIL,
} from 'mc-shared';
import {Deck} from '../../src/model/match/deck.js';
import {DiscardUntilEffect} from '../../src/effects/discard-until-effect.js';
import {EngageEffect} from '../../src/effects/engage-effect.js';

test('DiscardUntilEffect discards through a matching card and returns it for the next effect', async () => {
    const dialogs = [];
    const discardedMinion = {
        isMinion: true,
        traits: ['hydra'],
    };
    const mastersOfEvilMinion = {
        id: 'masters-of-evil-minion',
        isMinion: true,
        name: 'Masters of Evil minion',
        traits: [TRAIT_MASTERS_OF_EVIL],
        toObj() {
            return {id: this.id, name: this.name};
        },
    };
    const remainingCard = {
        isMinion: false,
        traits: [],
    };
    const deck = new Deck({owner: {match: {}}});
    deck.cards = [discardedMinion, mastersOfEvilMinion, remainingCard];

    const effect = new DiscardUntilEffect({
        condition: {
            isMinion: true,
            traits: [TRAIT_MASTERS_OF_EVIL],
        },
        match: {
            async openDialog(dialog) {
                dialogs.push(dialog);
            },
        },
        selectedTarget: deck,
    });
    const params = {};

    await effect.execute(params);

    assert.equal(params.selectedCard, mastersOfEvilMinion);
    assert.deepEqual(deck.discardPile, [discardedMinion, mastersOfEvilMinion]);
    assert.deepEqual(deck.cards, [remainingCard]);
    assert.deepEqual(dialogs, []);
});

test('EngageEffect assigns a minion to the player it engages', async () => {
    const resolvingPlayer = {};
    const engagedMinions = [];
    const events = [];
    const dialogs = [];
    const initialPlayer = {
        async refresh() {
            events.push('refresh');
        },
        engage(card) {
            events.push('engage');
            engagedMinions.push(card);
        },
    };
    const minion = {
        id: 'minion-from-scenario-discard',
        isMinion: true,
        isInPlay: false,
        isPlayerCard: false,
        name: 'Esbirro',
        async initTriggers() {},
        toObj() {
            return {id: this.id, name: this.name};
        },
        owner: undefined,
    };
    const deck = {
        discardPile: [minion],
        isScenarioDeck: true,
        async refresh() {},
        searchDiscard(card) {
            this.discardPile.splice(this.discardPile.indexOf(card), 1);
        },
    };
    minion.owner = {deck};

    const match = {
        async openDialog(dialog) {
            assert.equal(minion.engaged, initialPlayer);
            assert.deepEqual(engagedMinions, [minion]);
            events.push('dialog');
            dialogs.push(dialog);
        },
    };
    const effect = new EngageEffect({
        card: minion,
        match,
        target: TARGET_INITIAL_PLAYER,
    });
    effect.selectedTarget = initialPlayer;

    await effect.execute({player: resolvingPlayer});

    assert.equal(minion.controller, initialPlayer);
    assert.equal(minion.engaged, initialPlayer);
    assert.deepEqual(engagedMinions, [minion]);
    assert.deepEqual(events, ['engage', 'refresh', 'dialog']);
    assert.deepEqual(dialogs, [{
        dialogType: DIALOG_ENCOUNTERS_REVEAL,
        title: 'Esbirro puesto en juego',
        data: {
            card: {id: minion.id, name: minion.name},
        },
    }]);
});
