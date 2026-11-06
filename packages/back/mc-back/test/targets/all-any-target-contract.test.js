import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import * as shared from 'mc-shared';
import {ExhaustEffect} from '../../src/effects/exhaust-effect.js';
import {targetMap} from '../../src/targets/index.js';
import {ValidTarget} from '../../src/targets/valid-target.js';

describe('ALL and ANY target contracts', () => {
    const allTargets = Object.entries(shared)
        .filter(([name]) => name.startsWith('TARGET_ALL_'));
    const createContext = target => {
        const pool = ['first', 'excluded', 'last'].map((id, index) => ({
            id,
            eligible: index !== 1,
            name: id,
            isPlayerDeck: true,
            cards: [{id: `${id}-top`}],
            exhausted: false,
            exhaust() { this.exhausted = true; },
            async refresh() {},
            toObj() { return {id: this.id}; },
        }));
        pool.forEach(member => {
            member.superhero = {currentSide: member};
        });
        const actor = {
            id: 'actor',
            allies: pool,
            friends: pool,
            minions: pool,
            supports: pool,
        };
        const match = {
            name: 'target-contracts',
            triggerCards: {},
            players: [actor],
            heroes: pool,
            characters: pool,
            friends: pool,
            enemies: pool,
            minions: pool,
            schemes: pool,
            sideSchemes: pool,
            scenario: {},
            searchCards(condition) {
                assert.equal(condition.isSupport, true);
                return pool;
            },
        };
        if (target === shared.TARGET_ALL_PLAYERS || target === shared.TARGET_ANY_PLAYER) {
            match.players = pool;
        }
        if (target === shared.TARGET_ALL_DECKS || target === shared.TARGET_ANY_DECK) {
            match.scenario.deck = pool[0];
            match.players = [{deck: pool[1]}, {deck: pool[2]}];
        }
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            return {selected: dialog.data.multiSelect ?
                [dialog.data.cards.at(-1)] : dialog.data.cards.at(-1)};
        };
        return {actor, dialogs, match, pool, params: {player: actor, cards: pool, match}};
    };

    for (const [name, target] of allTargets) {
        test(`${name} resolves every condition-matching candidate without selecting one`, async () => {
            assert.equal(typeof targetMap[target], 'function');
            const {dialogs, match, params} = createContext(target);
            const validTarget = new ValidTarget({match, condition: {eligible: true}});
            assert.equal(validTarget.isAllTarget({target}), true);
            const selected = await validTarget.selectTarget({...params, target});
            assert.deepEqual(selected.map(candidate => candidate.id), ['first', 'last']);
            assert.deepEqual(dialogs, []);
        });

        test(`${name} keeps all ties after aggregate conditions and eligibility filters`, async () => {
            const {match, params, pool} = createContext(target);
            pool[0].score = 2;
            pool[1].score = 99;
            pool[2].score = 2;
            const validTarget = new ValidTarget({
                match,
                condition: {eligible: true, score: {operator: 'max'}},
            });
            const selected = await validTarget.selectTarget({...params, target});
            assert.deepEqual(selected.map(candidate => candidate.id), ['first', 'last']);
        });

        test(`${name} handles one or zero eligible candidates without a dialog`, async () => {
            const {dialogs, match, params, pool} = createContext(target);
            pool[0].eligible = false;
            const validTarget = new ValidTarget({match, condition: {eligible: true}});
            const only = await validTarget.selectTarget({...params, target});
            assert.deepEqual(only.map(candidate => candidate.id), ['last']);
            pool[2].eligible = false;
            assert.deepEqual(await validTarget.selectTarget({...params, target}), []);
            assert.deepEqual(dialogs, []);
        });

        if (target !== shared.TARGET_ALL_DECKS) {
            test(`${name} actually exhausts every eligible target and no others`, async () => {
                const {dialogs, match, params, pool} = createContext(target);
                const effect = new ExhaustEffect({
                    match, target, condition: {eligible: true},
                });
                assert.equal(await effect.canRun(params), true);
                await effect.runEffect(params);
                assert.deepEqual(pool.map(candidate => candidate.exhausted),
                    [true, false, true]);
                assert.deepEqual(dialogs, []);
            });
        }
    }

    for (const target of [
        shared.TARGET_ANY_PLAYER,
        shared.TARGET_ANY_DECK,
        shared.TARGET_ANY_CHARACTER_YOU_CONTROL,
        shared.TARGET_FRIENDLY_CHARACTER,
        shared.TARGET_ALLY_YOU_CONTROL,
        shared.TARGET_CHARACTER,
        shared.TARGET_ENEMY,
        shared.TARGET_HERO,
        shared.TARGET_MINION,
        shared.TARGET_SCHEME,
        shared.TARGET_SIDE_SCHEME,
        shared.TARGET_SUPPORT_YOU_CONTROL,
    ]) {
        test(`${target} offers the filtered pool but selects one`, async () => {
            const {actor, dialogs, match, params} = createContext(target);
            const validTarget = new ValidTarget({
                match, condition: {eligible: true},
            });
            assert.equal(validTarget.isAllTarget({target}), false);
            const selected = await validTarget.selectTarget({...params, target});
            assert.equal(selected.id, 'last');
            assert.equal(dialogs.length, 1);
            assert.equal(dialogs[0].targetPlayer, actor.id);
            assert.deepEqual(dialogs[0].data.cards.map(candidate => candidate.id),
                ['first', 'last']);
        });

        test(`${target} handles one or zero eligible candidates without a dialog`, async () => {
            const {dialogs, match, params, pool} = createContext(target);
            pool[0].eligible = false;
            const validTarget = new ValidTarget({match, condition: {eligible: true}});
            const only = await validTarget.selectTarget({...params, target});
            assert.equal(only.id, 'last');
            pool[2].eligible = false;
            assert.equal(await validTarget.selectTarget({...params, target}), null);
            assert.deepEqual(dialogs, []);
        });
    }

    test('explicit selectCount still chooses a subset of an ALL pool', async () => {
        const {dialogs, match, params} = createContext(shared.TARGET_ALL_MINIONS);
        const target = new ValidTarget({match, condition: {eligible: true}});
        const selected = await target.selectTarget({
            ...params, target: shared.TARGET_ALL_MINIONS, selectCount: 1,
        });
        assert.deepEqual(selected.map(candidate => candidate.id), ['last']);
        assert.equal(dialogs.length, 1);
    });

    test('controlled ally selectors use the ability controller, not a different triggering player', async () => {
        const {actor, dialogs, match, params, pool} =
            createContext(shared.TARGET_ALL_ALLIES_YOU_CONTROL);
        const controller = {...actor, isPlayer: true};
        actor.allies = [];
        const ability = {card: {controller}};
        const target = new ValidTarget({match, condition: {eligible: true}});
        const all = await target.selectTarget({
            ...params, ability, target: shared.TARGET_ALL_ALLIES_YOU_CONTROL,
        });
        assert.deepEqual(all.map(candidate => candidate.id), ['first', 'last']);
        const any = await target.selectTarget({
            ...params, ability, target: shared.TARGET_ALLY_YOU_CONTROL,
        });
        assert.equal(any.id, pool[2].id);
        assert.equal(dialogs.length, 1);
    });

    test('friendly character selection spans players while the you-control selector stays local', async () => {
        const ownCharacter = {
            id: 'own-character',
            toObj() { return {id: this.id}; },
        };
        const otherCharacter = {
            id: 'other-character',
            toObj() { return {id: this.id}; },
        };
        const player = {id: 'actor', friends: [ownCharacter]};
        const otherPlayer = {id: 'other-player', friends: [otherCharacter]};
        const match = {
            players: [player, otherPlayer],
            openDialog: async dialog => ({
                selected: dialog.data.cards.at(-1),
            }),
        };
        const validTarget = new ValidTarget({match});

        assert.deepEqual(
            validTarget.getValidTarget({
                match, player, target: shared.TARGET_FRIENDLY_CHARACTER,
            }),
            [ownCharacter, otherCharacter]
        );
        assert.deepEqual(
            validTarget.getValidTarget({
                match, player,
                target: shared.TARGET_ANY_CHARACTER_YOU_CONTROL,
            }),
            [ownCharacter]
        );
        assert.equal(
            (await validTarget.selectTarget({
                match, player, target: shared.TARGET_FRIENDLY_CHARACTER,
            })).id,
            'other-character'
        );
    });

    test('ALL and single character selectors support OR conditions and preserve named identity sides', async () => {
        for (const target of [shared.TARGET_ALL_CHARACTERS, shared.TARGET_CHARACTER]) {
            const {dialogs, match, params, pool} = createContext(target);
            const namedSide = {
                id: 'hero-side',
                name: 'Hero',
                toObj() { return {id: this.id}; },
            };
            pool[0].mainName = 'Hero';
            pool[0].sides = [{id: 'alter-ego-side', name: 'first'}, namedSide];
            const validTarget = new ValidTarget({
                match, condition: [{name: 'Hero'}, {name: 'last'}],
            });
            const selected = await validTarget.selectTarget({...params, target});
            assert.deepEqual(target === shared.TARGET_ALL_CHARACTERS ?
                selected.map(candidate => candidate.id) : [selected.id],
            target === shared.TARGET_ALL_CHARACTERS ? ['hero-side', 'last'] : ['last']);
            assert.equal(dialogs.length, target === shared.TARGET_ALL_CHARACTERS ? 0 : 1);
            assert.deepEqual(validTarget.getValidTarget({
                ...params, target, playCardEffect: {},
            }).map(candidate => candidate.id), ['last']);
        }
    });
});
