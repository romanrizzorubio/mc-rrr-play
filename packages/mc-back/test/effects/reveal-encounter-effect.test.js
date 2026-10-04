import assert from 'node:assert/strict';
import {test} from 'node:test';

import {PLACE_ENCOUNTER_DECK} from 'mc-shared';
import {CANCEL_ENCOUNTER_FULL} from '../../src/effects/cancel-encounter-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {Player} from '../../src/model/match/player.js';

const createEncounterCard = id => ({
    id,
    isEncounterCard: true,
    toObj() {
        return {id: this.id};
    },
});

test('RevealEncounterEffect defaults to the first dealt encounter card', async () => {
    const first = createEncounterCard('first');
    const second = createEncounterCard('second');
    const player = {encounters: [first, second]};
    const effect = new RevealEncounterEffect({match: {}});
    effect.selectedTarget = createEncounterCard('inherited-target');
    let revealedCard;
    effect.openDialog = async ({data}) => {
        revealedCard = data.card;
    };

    assert.equal(await effect.canRun({player}), true);
    await effect.prepare({player});

    assert.deepEqual(revealedCard, {id: 'first'});
    assert.deepEqual(player.encounters, [second]);
});

test('RevealEncounterEffect can draw from the encounter deck', async () => {
    const topCard = createEncounterCard('top');
    const pendingCard = createEncounterCard('pending');
    const player = {encounters: [pendingCard]};
    const match = {
        drawEncounterCards: async () => [topCard],
        scenario: {
            deck: {
                cards: [topCard],
                discardPile: [],
            },
        },
    };
    const effect = new RevealEncounterEffect({
        from: PLACE_ENCOUNTER_DECK,
        match,
    });
    effect.selectedTarget = createEncounterCard('inherited-target');
    let revealedCard;
    effect.openDialog = async ({data}) => {
        revealedCard = data.card;
    };

    assert.equal(await effect.canRun({player}), true);
    await effect.prepare({player});

    assert.deepEqual(revealedCard, {id: 'top'});
    assert.deepEqual(player.encounters, [pendingCard]);
});

test('a fully canceled encounter card is discarded', async () => {
    let discarded = false;
    const effect = new RevealEncounterEffect({match: {}});
    effect.selectedTarget = {
        isEncounterCard: true,
        async discard() {
            discarded = true;
        },
    };
    effect.trigger = async () => {
        effect.canceled = CANCEL_ENCOUNTER_FULL;
        return false;
    };

    assert.equal(await effect.triggerInit({}), false);
    assert.equal(discarded, true);
});

test('nested reveals skip dealt cards already consumed by another reveal', async () => {
    const first = createEncounterCard('first');
    const second = createEncounterCard('second');
    const third = createEncounterCard('third');
    const revealed = [];
    const player = {
        encounters: [first, second, third],
        async revealEncounterCard(card) {
            revealed.push(card);
            if (card === first) {
                await this.revealEncounterCard(this.encounters.shift());
            }
        },
    };

    await Player.prototype.revealEncounterCards.call(player);

    assert.deepEqual(revealed, [first, second, third]);
    assert.deepEqual(player.encounters, []);
});
