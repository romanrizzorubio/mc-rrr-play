import assert from 'node:assert/strict';
import {test} from 'node:test';

import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {AllyCard} from '../../src/model/printed/ally-card.js';

test('records the ally selected in the maximum-allies dialog', async () => {
    const dialogs = [];
    const match = {
        isUniqueCard: () => false,
        openDialog: async dialog => {
            dialogs.push(dialog);

            return {
                accepted: true,
                selected: {
                    id: 'ally-2',
                },
            };
        },
        triggerCards: {},
    };
    const player = {
        allies: [
            {id: 'ally-1', toObj() { return {id: this.id}; }},
            {id: 'ally-2', toObj() { return {id: this.id}; }},
            {id: 'ally-3', toObj() { return {id: this.id}; }},
        ],
    };
    const card = new AllyCard({
        attack: 1,
        cost: 1,
        hitPoints: 1,
        id: 'new-ally',
        image: 'ally.webp',
        match,
        name: 'New Ally',
        set: 'test',
        thwart: 1,
    });
    const playCardEffect = new PlayCardEffect({
        card,
        match,
    });

    assert.equal(await playCardEffect.canRun({player}), true);
    assert.equal(playCardEffect.maxAlliesDialogAccepted, true);
    assert.equal(playCardEffect.maxAllyToDiscardId, 'ally-2');
    assert.equal(await playCardEffect.canRun({player}), true);
    assert.equal(dialogs.length, 1);
});

test('discards the ally selected when accepting the maximum-allies dialog', async () => {
    const cards = [];
    let selectedAllyDiscarded = false;
    const selectedAlly = {
        id: 'selected-ally',
        isAlly: true,
        async discard() {
            selectedAllyDiscarded = true;
            cards.splice(cards.indexOf(this), 1);
        },
    };
    cards.push(selectedAlly, {id: 'ally-2', isAlly: true}, {id: 'ally-3', isAlly: true});

    const player = {
        gameZone: {
            cards,
            addToGameZone(card) {
                cards.push(card);
            },
            async refresh() {},
        },
        deck: {
            async refresh() {},
        },
    };
    Object.defineProperty(player, 'allies', {
        get: () => cards.filter(card => card.isAlly),
    });

    const delayedEffects = [];
    const playCardEffect = {
        createDelayedEffect(effect) {
            delayedEffects.push(effect);
        },
    };
    const newAlly = {
        id: 'new-ally',
        isAlly: true,
        isInPlay: false,
        isPlayerCard: false,
        async initTriggers() {},
    };
    const effect = new PutPlayEffect({
        card: newAlly,
        controller: player,
        match: {
            triggerCards: {},
        },
        maxAllyToDiscardId: selectedAlly.id,
    });

    await effect.execute({
        card: newAlly,
        effect: playCardEffect,
        player,
    });

    assert.equal(delayedEffects.length, 1);
    assert.equal(delayedEffects[0].effect.selectedTarget, selectedAlly);
    await delayedEffects[0].resolve({player});

    assert.equal(selectedAllyDiscarded, true);
    assert.equal(player.allies.length, 3);
});
