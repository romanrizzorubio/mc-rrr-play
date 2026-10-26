import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    TARGET_ALL_CARDS,
    TARGET_ALL_CHARACTERS,
    TARGET_PARENT,
    TARGET_YOU,
} from 'mc-shared';
import {SimultaneousEffect} from '../../src/effects/simultaneous-effect.js';
import {Effect} from '../../src/effects/effect.js';
import {getEffectTargetEntries} from '../../src/utils/effect-targets.js';

const createCard = (id, {
    isEncounterCard = false,
    name = 'Spiderwoman',
    set = 'Spiderwoman',
} = {}) => ({
    abilities: [],
    id,
    isEncounterCard,
    isInPlay: true,
    isPlayerCard: !isEncounterCard,
    name,
    set,
});

const createSourceCard = () => {
    const superhero = createCard('spiderwoman-hero');
    const sourceCard = createCard('planeo-controlado', {
        name: 'Planeo controlado',
    });
    sourceCard.owner = {superhero};

    return sourceCard;
};

describe('Referential ability targets', () => {
    test('keeps all matches from the highest available reference tier', () => {
        const sourceCard = createSourceCard();
        const spiderwoman = createCard('spiderwoman');
        const secondSpiderwoman = createCard('second-spiderwoman');
        const unrelatedSpiderwoman = createCard('unrelated-spiderwoman', {
            set: 'aggression',
        });
        const spidergirl = createCard('spidergirl', {name: 'Spidergirl'});
        const encounterSpiderwoman = createCard('encounter-spiderwoman', {
            isEncounterCard: true,
            set: 'Standard',
        });
        const match = {
            enemies: [encounterSpiderwoman],
            friends: [
                spiderwoman,
                secondSpiderwoman,
                unrelatedSpiderwoman,
                spidergirl,
            ],
            players: [],
        };
        const effect = new Effect({
            ability: {card: sourceCard},
            condition: {name: 'Spiderwoman'},
            match,
            target: TARGET_ALL_CHARACTERS,
        });

        assert.deepEqual(effect.getValidTarget({match, player: {}}), [
            spiderwoman,
            secondSpiderwoman,
        ]);
    });

    test('falls back to the source card category when no associated-set match exists', () => {
        const sourceCard = createSourceCard();
        const playerSpiderwoman = createCard('player-spiderwoman', {
            set: 'basic',
        });
        const encounterSpiderwoman = createCard('encounter-spiderwoman', {
            isEncounterCard: true,
            set: 'Standard',
        });
        const match = {
            enemies: [encounterSpiderwoman],
            friends: [playerSpiderwoman],
            players: [],
        };
        const effect = new Effect({
            ability: {card: sourceCard},
            condition: {name: 'Spiderwoman'},
            match,
            target: TARGET_ALL_CHARACTERS,
        });

        assert.deepEqual(effect.getValidTarget({match, player: {}}), [
            playerSpiderwoman,
        ]);
    });

    test('the source card outranks cards from its associated set', () => {
        const sourceCard = createCard('spiderwoman', {
            name: 'Spiderwoman',
        });
        sourceCard.owner = {superhero: createCard('spiderwoman-hero')};
        const sameSetCard = createCard('same-set-spiderwoman');
        const effect = new Effect({
            ability: {card: sourceCard},
            condition: {name: 'Spiderwoman'},
            match: {},
            target: TARGET_ALL_CARDS,
        });

        assert.deepEqual(effect.getValidTarget({
            cards: [sameSetCard, sourceCard],
            match: {},
            player: {},
        }), [sourceCard]);
    });

    test('selectFrom keeps only targets in the highest reference tier', async () => {
        const sourceCard = createSourceCard();
        const spiderwoman = createCard('spiderwoman');
        const unrelatedSpiderwoman = createCard('unrelated-spiderwoman', {
            set: 'aggression',
        });
        const effect = new Effect({
            ability: {card: sourceCard},
            condition: {name: 'Spiderwoman'},
            match: {},
            target: TARGET_ALL_CHARACTERS,
        });

        const selected = await effect.validTarget.selectFrom(
            [unrelatedSpiderwoman, spiderwoman],
            {match: {}, player: {}},
        );

        assert.strictEqual(selected, spiderwoman);
    });

    test('rejects a preselected target below the highest reference tier', () => {
        const sourceCard = createSourceCard();
        const spiderwoman = createCard('spiderwoman');
        const unrelatedSpiderwoman = createCard('unrelated-spiderwoman', {
            set: 'aggression',
        });
        const match = {
            enemies: [],
            friends: [spiderwoman, unrelatedSpiderwoman],
            players: [],
        };
        const effect = new Effect({
            ability: {card: sourceCard},
            condition: {name: 'Spiderwoman'},
            match,
            target: TARGET_ALL_CHARACTERS,
            selectedTarget: unrelatedSpiderwoman,
        });

        assert.deepEqual(effect.getValidTarget({
            fixedPreselectedTarget: true,
            match,
            player: {},
        }), []);
    });

    test('preserves player targets when a condition name filters cards in hand', () => {
        const sourceCard = createCard('thor-obligation', {
            isEncounterCard: true,
            name: 'La ira de Odín',
            set: 'Thor',
        });
        const player = {
            id: 'thor',
            isPlayer: true,
            isSuperhero: true,
            name: 'Thor',
        };
        const match = {};
        const effect = new Effect({
            ability: {card: sourceCard},
            condition: {name: 'Mjolnir'},
            match,
            target: TARGET_YOU,
        });

        assert.deepEqual(effect.getValidTarget({match, player}), [player]);
    });

    test('resolves TARGET_PARENT through simultaneous child effects', async () => {
        const sourceCard = createSourceCard();
        const spiderwoman = createCard('spiderwoman');
        const captainMarvel = createCard('captain-marvel', {
            name: 'Capitana Marvel',
            set: 'basic',
        });
        const match = {
            enemies: [],
            friends: [spiderwoman, captainMarvel],
            players: [],
        };
        const group = new SimultaneousEffect({
            condition: {name: 'Spiderwoman'},
            effects: [
                new Effect({match, target: TARGET_PARENT}),
                new Effect({match, target: TARGET_PARENT}),
            ],
            match,
            target: TARGET_ALL_CHARACTERS,
        });
        group.ability = {card: sourceCard};

        const entries = await getEffectTargetEntries(group, {
            match,
            player: {},
        });

        assert.deepEqual(entries.map(({targets}) =>
            targets.flat(Infinity)), [
            [spiderwoman],
            [spiderwoman],
            [spiderwoman],
        ]);
        assert.equal(await group.canRun({match, player: {}}), true);
    });

    test('revalidates a preselected TARGET_PARENT against its parent candidates', () => {
        const spiderwoman = createCard('spiderwoman');
        const captainMarvel = createCard('captain-marvel', {
            name: 'Capitana Marvel',
            set: 'basic',
        });
        const effect = new Effect({
            match: {},
            selectedTarget: captainMarvel,
            target: TARGET_PARENT,
        });

        assert.deepEqual(effect.getValidTarget({
            match: {},
            parentTargets: [spiderwoman],
            player: {},
        }), []);
    });
});
