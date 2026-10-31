import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_ALLY,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_MINION,
    DIALOG_USE_CARD,
    EFFECT_DEAL_DAMAGE,
    PRIORITY_FORCED_INTERRUPT,
    TARGET_VILLAIN,
    TRAIT_TECH,
    TRIGGER_CHARACTER_ATTACKED,
} from 'mc-shared';
import kang from '../../../mc-data/seed/catalog/scenarios/kang.js';
import blackPanther from '../../../mc-data/seed/catalog/heroes/blackpanther.js';
import standard from '../../../mc-data/seed/catalog/sets/standard.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {AttackBasicAbility} from '../../src/abilities/basic/attack-basic-ability.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {SimultaneousEffect} from '../../src/effects/simultaneous-effect.js';

describe('Escudo temporal', () => {
    const createGame = async () => {
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'temporal-shield-test',
        });
        match.persist = async () => {};
        match.refresh = async () => {};
        match.openDialog = async dialog => dialog.dialogType === DIALOG_USE_CARD ?
            {selected: {id: dialog.data.cards[0].id}} :
            {};
        const factory = new MatchFactory(match);
        const player = match.createPlayer({
            name: 'Jugador',
            initial: true,
            superhero: factory.createSuperhero({
                ...blackPanther.config,
                cards: [],
                precon: [],
                nemesis: [],
                obligation: undefined,
            }),
        });
        player.initPlayer();
        player.superhero.selectedSide = 1;
        match.currentPlayer = player;
        match.currentTurnPlayer = player;
        const scenario = await factory.createScenario({
            ...structuredClone(kang.config),
            cards: structuredClone([...kang.config.cards, ...standard.config.cards]),
            sets: [],
            defaultSets: [],
        });
        match.addScenario(scenario);
        await scenario.initScenario([], false);
        match.playing = true;
        match.phase = 'players';
        match.villain.tough = 0;
        const shields = scenario.scenarioCards.filter(card => card.name === 'Escudo temporal');
        for (const card of shields) {
            await new PutPlayEffect({
                match,
                card,
                controller: scenario,
                target: TARGET_VILLAIN,
            }).runEffect({match, player});
        }

        return {match, factory, player, scenario, shields, villain: match.villain};
    };
    const createAttack = (match, player, selectedTarget, damage, character = player.superhero) =>
        match.effectsFactory.createEffect({
            type: EFFECT_DEAL_DAMAGE,
            params: {selectedTarget, damage, character, isAttack: true},
        });

    test('the scenario owns exactly two runnable Technology attachments with one boost icon', async () => {
        const entry = kang.config.cards.find(({card}) =>
            card.params.name === 'Escudo temporal');
        assert.equal(entry.count, 2);
        assert.equal(entry.card.type, CARD_TYPE_ATTACHMENT);
        assert.equal(entry.card.params.image, 'scenarios/kang/11014.png');
        assert.deepEqual(entry.card.params.traits, [TRAIT_TECH]);
        assert.equal(entry.card.params.boost, 1);
        assert.equal(entry.card.params.attach, TARGET_VILLAIN);

        const {scenario, shields, villain} = await createGame();
        assert.equal(scenario.scenarioCards.filter(card => card.name === 'Escudo temporal').length, 2);
        assert.equal(new Set(shields.map(card => card.id)).size, 2);
        for (const shield of shields) {
            assert.equal(shield.attachedTo, villain);
            assert.ok(shield.abilities[0].effect instanceof SimultaneousEffect);
            assert.equal(typeof shield.abilities[0].effect.canRun, 'function');
            assert.equal(shield.abilities[0].isAttack, false);
            assert.equal(shield.abilities[0].isDefense, false);
        }
    });

    for (const damage of [0, 5]) {
        test(`a ${damage}-damage attack discards only one copy, prevents damage and hurts its attacker`, async () => {
            const {match, player, scenario, shields, villain} = await createGame();
            const attack = createAttack(match, player, villain, damage);

            await attack.runEffect({match, player});

            assert.equal(attack.resolved, true);
            assert.equal(villain.damage, 0);
            assert.equal(player.superhero.damage, 1);
            assert.equal(shields.filter(card => card.isInPlay).length, 1);
            assert.equal(scenario.deck.discardPile.length, 1);
            const discarded = shields.find(card => !card.isInPlay);
            assert.equal(discarded.attachedTo, undefined);
            assert.equal(discarded.abilities[0].resolved, true);
            const remaining = shields.find(card => card.isInPlay);
            const trigger = remaining.triggers[TRIGGER_CHARACTER_ATTACKED]
                [PRIORITY_FORCED_INTERRUPT][0];
            assert.equal(await trigger.canTrigger(attack.getTriggersParams({match, player})), false);

            const nextAttack = createAttack(match, player, villain, 7);
            await nextAttack.runEffect({match, player});

            assert.equal(nextAttack.resolved, true);
            assert.equal(villain.damage, 0);
            assert.equal(player.superhero.damage, 2);
            assert.ok(shields.every(card => !card.isInPlay));
            assert.equal(scenario.deck.discardPile.length, 2);

            const unprotectedAttack = createAttack(match, player, villain, 3);
            await unprotectedAttack.runEffect({match, player});
            assert.equal(villain.damage, 3);
            assert.equal(player.superhero.damage, 2);
        });
    }

    test('non-attack damage and attacks on another enemy do not consume the shield', async () => {
        const {match, factory, player, shields, villain} = await createGame();
        const damage = match.effectsFactory.createEffect({
            type: EFFECT_DEAL_DAMAGE,
            params: {selectedTarget: villain, damage: 2, isAttack: false},
        });
        await damage.runEffect({match, player});
        assert.equal(villain.damage, 2);
        assert.ok(shields.every(card => card.isInPlay));

        const minion = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {name: 'Otro enemigo', hitPoints: 10, attack: 1, scheme: 1},
        });
        player.gameZone.addToGameZone(minion);
        minion.engaged = player;
        await createAttack(match, player, minion, 3).runEffect({match, player});
        assert.equal(minion.damage, 3);
        assert.equal(player.superhero.damage, 0);
        assert.ok(shields.every(card => card.isInPlay));
    });

    test('an ally is the reflected-damage target, not its controlling hero', async () => {
        const {match, factory, player, shields, villain} = await createGame();
        const ally = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {name: 'Aliado atacante', hitPoints: 4, attack: 2, thwart: 1},
        });
        player.gameZone.addToGameZone(ally);
        ally.controller = player;
        await createAttack(match, player, villain, 2, ally).runEffect({match, player});
        assert.equal(ally.damage, 1);
        assert.equal(player.superhero.damage, 0);
        assert.equal(villain.damage, 0);
        assert.equal(shields.filter(card => card.isInPlay).length, 1);
    });

    test('a real basic attack pays its cost and remains prevented after ATK is recalculated', async () => {
        const {match, player, shields, villain} = await createGame();
        const hero = player.superhero.currentSide;
        const ability = new AttackBasicAbility({match, card: hero});
        ability.effect.selectedTarget = villain;

        await ability.resolveAbility({match, player, card: hero, preselectedTarget: true});

        assert.equal(ability.resolved, true);
        assert.equal(hero.exhausted, true);
        assert.equal(villain.damage, 0);
        assert.equal(player.superhero.damage, 1);
        assert.equal(shields.filter(card => card.isInPlay).length, 1);
    });

    test('prevention is limited to Kang in a multi-target attack', async () => {
        const {match, factory, player, shields, villain} = await createGame();
        const minion = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {name: 'Segundo objetivo', hitPoints: 10, attack: 1, scheme: 1},
        });
        player.gameZone.addToGameZone(minion);
        minion.engaged = player;
        const attack = createAttack(match, player, [minion, villain], [3, 6]);

        await attack.runEffect({match, player});

        assert.equal(attack.resolved, true);
        assert.equal(minion.damage, 3);
        assert.equal(villain.damage, 0);
        assert.equal(player.superhero.damage, 1);
        assert.equal(shields.filter(card => card.isInPlay).length, 1);
    });

    test('Tough on the attacker prevents reflected damage without stopping shield prevention', async () => {
        const {match, player, shields, villain} = await createGame();
        villain.tough = 1;
        player.superhero.tough = 1;
        const attack = createAttack(match, player, villain, 4);
        attack.keywords.piercing = true;

        await attack.runEffect({match, player});

        assert.equal(attack.resolved, true);
        assert.equal(villain.damage, 0);
        assert.equal(villain.tough, 1);
        assert.equal(player.superhero.damage, 0);
        assert.equal(player.superhero.tough, 0);
        assert.equal(shields.filter(card => card.isInPlay).length, 1);
    });

    test('a stunned attack removes Stunned without consuming either shield', async () => {
        const {match, player, shields, villain} = await createGame();
        player.superhero.stunned = 1;
        const attack = createAttack(match, player, villain, 4);
        await attack.runEffect({match, player});
        assert.equal(player.superhero.isStunned, false);
        assert.equal(attack.resolved, false);
        assert.equal(villain.damage, 0);
        assert.equal(player.superhero.damage, 0);
        assert.ok(shields.every(card => card.isInPlay));
    });
});
