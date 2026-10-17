import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    EFFECT_REMOVE_COUNTER,
    PRIORITY_CONSTANT,
    PRIORITY_FORCED_INTERRUPT,
    PRIORITY_FORCED_RESPONSE,
    TARGET_ENVIRONMENT,
    TARGET_ENEMY,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_MAIN_SCHEME_COMPLETED,
    TRIGGER_THIS_COUNTERS_REMOVED,
    TRIGGER_THIS_ENTER_PLAY,
    TRIGGER_VILLAIN_ATTACKS,
    TRIGGER_VILLAIN_SCHEMES,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {AttackBasicAbility} from '../../src/abilities/basic/attack-basic-ability.js';
import {ConstantAbility} from '../../src/abilities/misc/constant-ability.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {ReplaceEffect} from '../../src/effects/replace-effect.js';
import {PlayVillainPhaseEffect} from '../../src/effects/play-villain-phase-effect.js';
import {Match} from '../../src/model/match/match.js';
import {Scenario} from '../../src/model/match/scenario.js';
import {ScenarioZone} from '../../src/model/match/scenario-zone.js';
import {ValidTarget} from '../../src/targets/valid-target.js';
import {restoreMatch, serializeMatch} from '../../src/utils/match-serialization.js';

const getRiskyBusiness = async () => {
    const {scenarios} = await loadCatalog();
    const scenario = scenarios.find(({_id}) => _id === 'risky-business');

    assert.ok(scenario);
    return scenario;
};

const createMatchFactory = () => {
    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'risky-business-test',
    });
    match.openDialog = async () => {};

    return {
        factory: new MatchFactory(match),
        match,
    };
};

const createRiskyBusinessGame = async ({
    environmentSide = 0,
    villainSide = 0,
    villainStage = 1,
} = {}) => {
    const scenarioData = await getRiskyBusiness();
    const {factory, match} = createMatchFactory();
    const scenario = new Scenario({
        mainSchemes: [],
        match,
        name: 'risky-business-effects',
        scenarioCards: [],
        sets: [],
        villains: [],
    });
    scenario.gameZone = new ScenarioZone({owner: scenario});
    scenario.gameZone.currentScheme = {
        currentSide: {isMainScheme: true},
    };
    scenario.gameZone.refresh = async () => {};
    match.scenario = scenario;
    match.openDialog = async () => {};
    match.isUniqueCard = () => false;

    const player = {
        initial: true,
        isHero: false,
        match,
        hand: {async refresh() {}},
        deck: {async discardTopCards() { return []; }, refresh() {}},
        friends: [],
    };
    match.players = [player];

    const environmentConfig = scenarioData.config.cards.find(({card}) =>
        card.params.name === 'Empresa criminal').card;
    const environment = factory.cardsFactory.createGameCardFromConfig(environmentConfig);
    const villain = factory.cardsFactory.createGameCardFromConfig(
        scenarioData.config.villains[villainStage - 1]
    );
    environment.selectedSide = environmentSide;
    environment.counters = 2;
    environment.owner = scenario;
    environment.controller = scenario;
    villain.selectedSide = villainSide;
    villain.owner = scenario;
    villain.controller = scenario;
    environment.refresh = async () => {};
    villain.refresh = async () => {};

    scenario.gameZone.currentVillain = villain;
    scenario.gameZone.addToGameZone(environment);
    scenario.gameZone.addToGameZone(villain);
    await environment.initTriggers({player});
    await villain.initTriggers({player});

    return {environment, factory, match, player, scenario, villain};
};

describe('Risky Business', () => {
    test('Risky Business catalog defines its stages and all encounter card copies', async () => {
        const scenario = await getRiskyBusiness();
        const {config} = scenario;

        assert.equal(scenario.name, 'Negocios arriesgados');
        assert.deepEqual(config.sets, ['standard']);
        assert.deepEqual(config.defaultSets, ['goblin-gimmicks']);
        assert.deepEqual(config.villains.map(({params}) =>
            params.sides.map(({params: side}) => side.name)), [
            ['Norman Osborn', 'Duende Verde'],
            ['Norman Osborn', 'Duende Verde'],
            ['Norman Osborn', 'Duende Verde'],
        ]);
        assert.deepEqual(config.villains.map(({params}) =>
            params.sides.map(({params: side}) => side.hitPoints)), [
            [[14, true], [14, true]],
            [[18, true], [18, true]],
            [[22, true], [22, true]],
        ]);
        assert.deepEqual(config.mainSchemes.map(([sideA, sideB]) => [
            sideA.params.name,
            sideA.params.stage,
            sideB.params.startingThreat,
            sideB.params.acceleration,
            sideB.params.value,
            sideB.params.final,
        ]), [
            ['OPA hostil', 1, [2, true], [1, true], [7, true], undefined],
            ['Adquisición corporativa', 2, [1, true], [2, true], [10, true], true],
        ]);
        assert.deepEqual(config.mainSchemes[1][1].params.icons, {hazard: 1});

        const copies = Object.fromEntries(config.cards.map(({count, card}) => [
            card.params.name,
            count,
        ]));
        assert.deepEqual(copies, {
            'Empresa criminal': 1,
            'Pistolero a sueldo': 3,
            'Guardia privado de seguridad': 4,
            'Puente inestable': 1,
            'Industrias Oscorp': 2,
            Soborno: 2,
            'Rutina laboral': 4,
            'Genio loco': 2,
        });
        assert.equal(config.cards.reduce((total, {count}) => total + count, 0), 19);
        assert.equal(
            config.cards.find(({card}) => card.params.name === 'Puente inestable').card.params.boost,
            0
        );
        assert.equal(
            config.cards.find(({card}) => card.params.name === 'Rutina laboral').card.params.boost,
            0
        );
    });

    test('Adquisición corporativa hazard icon deals an extra encounter while in play', async () => {
        const scenarioData = await getRiskyBusiness();
        const {factory, match} = createMatchFactory();
        const scenario = new Scenario({
            mainSchemes: [],
            match,
            name: 'risky-business-hazard-icon',
            scenarioCards: [],
            sets: [],
            villains: [],
        });
        scenario.gameZone = new ScenarioZone({owner: scenario});
        scenario.deck = {knownCards: []};
        scenario.gameZone.currentScheme = factory.cardsFactory.createGameCardFromConfig(
            scenarioData.config.mainSchemes[1][1]
        );
        match.scenario = scenario;

        let dealtCards = 0;
        const dialogs = [];
        const player = {
            initial: true,
            isHero: false,
            match,
            superhero: {name: 'Hulka'},
            hazardIcons: 0,
            encounters: [],
            gameZone: {
                dealEncounterCard(cards) {
                    player.encounters.push(...cards);
                },
                async refresh() {},
            },
        };
        match.players = [player];
        match.currentPlayer = player;
        match.drawEncounterCards = async () => [{
            id: `encounter-${++dealtCards}`,
            toObj() {
                return {id: this.id};
            },
        }];
        match.openDialog = async dialog => dialogs.push(dialog);

        const phase = new PlayVillainPhaseEffect({match});
        await phase.stepDealEncounters();

        assert.equal(match.hazardIcons, 1);
        assert.equal(player.encounters.length, 2);
        assert.equal(dialogs[0].data.hazardIcons, 1);
    });

    test('Risky Business card abilities are parsed as single, runnable effects', async () => {
        const scenario = await getRiskyBusiness();
        const {factory} = createMatchFactory();
        const cards = scenario.config.cards.map(({card}) =>
            factory.cardsFactory.createGameCardFromConfig(card));
        const villains = scenario.config.villains.map(card =>
            factory.cardsFactory.createGameCardFromConfig(card));
        const schemes = scenario.config.mainSchemes.flat()
            .map(card => factory.cardsFactory.createGameCardFromConfig(card));

        for (const card of [...cards, ...villains, ...schemes]) {
            const sides = card.sides.length ? card.sides : [card];

            for (const side of sides) {
                const abilities = [...side.abilities, side.boostAbility].filter(Boolean);
                for (const ability of abilities) {
                    if (ability.effect) {
                        assert.equal(Array.isArray(ability.effect), false);
                        assert.equal(typeof ability.effect.canRun, 'function');
                    }
                }
            }
        }
    });

    test('OPA hostil only discards after Infamy is placed on the active Company side', async () => {
        const scenarioData = await getRiskyBusiness();
        const mainSchemeB = scenarioData.config.mainSchemes[0][1];

        const runCompletionEffect = async ({activeEnvironment, villainName}) => {
            const {factory, match} = createMatchFactory();
            const environmentConfig = scenarioData.config.cards.find(({card}) =>
                card.params.name === 'Empresa criminal').card;
            const environment = factory.cardsFactory.createGameCardFromConfig(environmentConfig);
            environment.selectedSide = activeEnvironment === 'company' ? 0 : 1;
            environment.counters = 2;
            environment.refresh = async () => {};

            const discardedByPlayer = [];
            const makePlayer = initial => ({
                initial,
                match,
                deck: {
                    async discardTopCards(count) {
                        discardedByPlayer.push({count, player: initial});
                        return [];
                    },
                    refresh() {},
                },
            });
            const firstPlayer = makePlayer(true);
            const secondPlayer = makePlayer(false);
            match.players = [firstPlayer, secondPlayer];
            const scheme = factory.cardsFactory.createGameCardFromConfig(mainSchemeB);
            match.scenario = {
                gameZone: {cards: [environment]},
                schemes: [scheme],
                villain: {name: villainName},
            };
            scheme.owner = match.scenario;
            scheme.controller = match.scenario;
            await scheme.initTriggers({player: firstPlayer});
            scheme.abilities[0].hideDialog = true;

            await match.trigger(
                PRIORITY_FORCED_RESPONSE,
                [TRIGGER_MAIN_SCHEME_COMPLETED],
                {
                    card: scheme,
                    effect: {selectedTarget: scheme},
                    player: firstPlayer,
                }
            );

            return {discardedByPlayer, environment};
        };

        const companySide = await runCompletionEffect({
            activeEnvironment: 'company',
            villainName: 'Norman Osborn',
        });
        assert.equal(companySide.environment.counters, 3);
        assert.equal(companySide.environment.toObj().counters, 3);
        assert.deepEqual(companySide.discardedByPlayer, [
            {count: 3, player: true},
            {count: 3, player: false},
        ]);

        const madnessSide = await runCompletionEffect({
            activeEnvironment: 'madness',
            villainName: 'Duende Verde',
        });
        assert.equal(madnessSide.environment.counters, 2);
        assert.deepEqual(madnessSide.discardedByPlayer, []);
    });

    test('removing the last environment counter flips both cards and reveals the new sides', async () => {
        const scenarioData = await getRiskyBusiness();
        const {factory, match} = createMatchFactory();
        const scenario = new Scenario({
            mainSchemes: [],
            match,
            name: 'risky-business-flip',
            scenarioCards: [],
            sets: [],
            villains: [],
        });
        scenario.gameZone = new ScenarioZone({owner: scenario});
        scenario.gameZone.currentScheme = {
            currentSide: {isMainScheme: true},
        };
        scenario.gameZone.refresh = async () => {};
        match.scenario = scenario;
        match.openDialog = async () => {};
        match.isUniqueCard = () => false;

        const player = {
            initial: true,
            isHero: false,
            match,
            hand: {async refresh() {}},
            deck: {async discardTopCards() { return []; }, refresh() {}},
            friends: [],
        };
        match.players = [player];

        const environmentConfig = scenarioData.config.cards.find(({card}) =>
            card.params.name === 'Empresa criminal').card;
        const environment = factory.cardsFactory.createGameCardFromConfig(environmentConfig);
        const villain = factory.cardsFactory.createGameCardFromConfig(
            scenarioData.config.villains[0]
        );
        environment.controller = scenario;
        villain.controller = scenario;
        villain.counters = 4;
        villain.damage = 5;
        villain.stunned = 1;
        villain.confused = 1;
        villain.tough = 1;
        villain.accelerationTokens = 2;
        villain.setExhausted(true);
        let attachmentDiscarded = false;
        const attachment = {
            attachedTo: villain,
            card: {attack: 0},
            toObj() {
                return {id: 'test-attachment'};
            },
            async discard() {
                attachmentDiscarded = true;
            },
        };
        villain.attached.push(attachment);
        environment.counters = 3;
        environment.refresh = async () => {};
        villain.refresh = async () => {};

        scenario.gameZone.currentVillain = villain;
        scenario.gameZone.addToGameZone(environment);
        scenario.gameZone.addToGameZone(villain);
        const environmentConstant = environment.currentSide.abilities.find(ability =>
            ability.trigger === TRIGGER_THIS_COUNTERS_REMOVED);
        assert.ok(environmentConstant instanceof ConstantAbility);
        assert.equal(environmentConstant.hideDialog, true);

        await environment.initTriggers({player});
        await villain.initTriggers({player});
        const counterRemovalTriggers =
            environment.triggers[TRIGGER_THIS_COUNTERS_REMOVED];
        assert.ok(counterRemovalTriggers[PRIORITY_CONSTANT]
            .some(trigger => trigger.ability === environmentConstant));
        assert.equal(counterRemovalTriggers[PRIORITY_FORCED_RESPONSE], undefined);

        const removeCounters = match.effectsFactory.createEffect({
            type: EFFECT_REMOVE_COUNTER,
            params: {
                count: 3,
                target: TARGET_ENVIRONMENT,
            },
        });
        await removeCounters.runEffect({player});

        assert.equal(environment.name, 'Estado de locura');
        assert.equal(environment.counters, 2);
        assert.equal(environment.toObj().name, 'Estado de locura');
        assert.equal(environment.toObj().counters, 2);
        assert.equal(villain.sameCard, true);
        assert.equal(villain.name, 'Duende Verde');
        assert.strictEqual(villain.controller, scenario);
        assert.equal(
            villain.attack,
            scenarioData.config.villains[0].params.sides[1].params.attack
        );
        assert.equal(villain.counters, 4);
        assert.equal(villain.damage, 5);
        assert.equal(villain.stunned, 1);
        assert.equal(villain.confused, 1);
        assert.equal(villain.tough, 1);
        assert.equal(villain.accelerationTokens, 2);
        assert.equal(villain.exhausted, true);
        assert.equal(villain.attached.includes(attachment), true);
        assert.equal(attachment.attachedTo, villain);
        assert.equal(attachmentDiscarded, false);
        assert.equal(villain.triggers[TRIGGER_VILLAIN_ATTACKS], undefined);
        assert.ok(villain.triggers[TRIGGER_VILLAIN_SCHEMES][PRIORITY_FORCED_INTERRUPT]
            .some(trigger => trigger.ability === villain.currentSide.abilities.find(
                ability => ability.trigger === TRIGGER_VILLAIN_SCHEMES
            )));
        assert.equal(scenario.gameZone.cards.filter(card => card === environment).length, 1);
        assert.equal(scenario.gameZone.cards.filter(card => card === villain).length, 1);
    });

    test('same-card villain metadata survives match save and restore', async () => {
        const scenarioData = await getRiskyBusiness();
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'risky-business-snapshot',
        });
        const factory = new MatchFactory(match);
        const scenario = new Scenario({
            mainSchemes: [],
            match,
            name: 'risky-business-snapshot',
            scenarioCards: [],
            sets: [],
            villains: [],
        });
        scenario.gameZone = new ScenarioZone({owner: scenario});
        const villain = factory.cardsFactory.createGameCardFromConfig(
            scenarioData.config.villains[0]
        );
        villain.owner = scenario;
        villain.controller = scenario;
        scenario.gameZone.currentVillain = villain;
        scenario.gameZone.addToGameZone(villain);
        match.scenario = scenario;

        const restoredMatch = restoreMatch(serializeMatch(match), {mc: match.mc});

        assert.equal(restoredMatch.scenario.villain.sameCard, true);
    });

    test('Norman replaces his attack and damage with Infamy counter changes', async () => {
        const {environment, match, player, villain} = await createRiskyBusinessGame();
        const attackInterrupt = villain.currentSide.abilities.find(ability =>
            ability.trigger === TRIGGER_VILLAIN_ATTACKS);
        attackInterrupt.hideDialog = true;
        assert.ok(attackInterrupt.effect instanceof ReplaceEffect);
        assert.equal(attackInterrupt.effect.effects, undefined);
        const operations = [];
        const placeCounters = environment.placeCounters.bind(environment);
        environment.placeCounters = count => {
            operations.push('place-counters');
            return placeCounters(count);
        };
        const attack = {
            character: villain,
            selectedTarget: player,
            cancelled: false,
            cancel() {
                operations.push('cancel-attack');
                this.cancelled = true;
            },
            checkTrigger() {
                return !this.cancelled;
            },
        };

        const attackCanContinue = await match.trigger(
            PRIORITY_FORCED_INTERRUPT,
            [TRIGGER_VILLAIN_ATTACKS],
            {
                attack: {effect: attack},
                character: villain,
                effect: attack,
                player,
            }
        );

        assert.equal(attackCanContinue, false);
        assert.equal(attack.cancelled, true);
        assert.equal(environment.counters, 3);
        assert.deepEqual(operations, ['cancel-attack', 'place-counters']);

        const damage = new TakeDamageEffect({
            damage: 2,
            match,
            selectedTarget: villain,
        });
        const damageOperations = [];
        const removeCounters = environment.removeCounters.bind(environment);
        environment.removeCounters = count => {
            damageOperations.push('remove-counters');
            return removeCounters(count);
        };
        const cancelDamage = damage.cancel.bind(damage);
        damage.cancel = () => {
            damageOperations.push('cancel-damage');
            cancelDamage();
        };
        villain.currentSide.abilities.find(ability =>
            ability.trigger === TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE).hideDialog = true;
        assert.ok(villain.currentSide.abilities.find(ability =>
            ability.trigger === TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE).effect instanceof ReplaceEffect);
        await damage.runEffect({player});

        assert.equal(damage.canceled, true);
        assert.equal(villain.damage, 0);
        assert.equal(environment.counters, 1);
        assert.deepEqual(damageOperations, ['cancel-damage', 'remove-counters']);
    });

    test('selecting Norman resolves the double-sided villain game card', async () => {
        const scenarioData = await getRiskyBusiness();
        const {factory, match, player, villain} = await createRiskyBusinessGame();
        const minionConfig = scenarioData.config.cards.find(({card}) =>
            card.params.name === 'Pistolero a sueldo').card;
        const minion = factory.cardsFactory.createGameCardFromConfig(minionConfig);
        player.minions = [minion];
        minion.controller = player;

        let displayedTarget;
        match.openDialog = async ({data}) => {
            displayedTarget = data.cards.find(({name}) => name === 'Norman Osborn');

            return {selected: displayedTarget};
        };

        const validTarget = new ValidTarget({match});
        const selectedTarget = await validTarget.selectTarget({
            player,
            target: TARGET_ENEMY,
        });

        assert.ok(displayedTarget);
        assert.notEqual(displayedTarget.id, villain.id);
        assert.equal(displayedTarget.parentId, villain.id);
        assert.strictEqual(selectedTarget, villain);
    });

    test('a basic attack selected on Norman removes his Infamy counters', async () => {
        const scenarioData = await getRiskyBusiness();
        const {environment, factory, match, player, villain} =
            await createRiskyBusinessGame();
        const minionConfig = scenarioData.config.cards.find(({card}) =>
            card.params.name === 'Pistolero a sueldo').card;
        const minion = factory.cardsFactory.createGameCardFromConfig(minionConfig);
        player.minions = [minion];
        minion.controller = player;
        environment.counters = 5;
        player.canAttack = () => true;
        villain.currentSide.abilities.find(ability =>
            ability.trigger === TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE).hideDialog = true;

        let selectedTarget;
        match.openDialog = async ({data}) => {
            selectedTarget = data.cards.find(({name}) => name === 'Norman Osborn');

            return {selected: selectedTarget};
        };

        const attacker = {
            async getAttackValue() {
                return 2;
            },
        };
        const attack = new AttackBasicAbility({
            card: attacker,
            match,
            name: 'Ataque',
        });

        await attack.resolveAbility({
            arrowPaid: true,
            card: attacker,
            player,
        });

        assert.ok(selectedTarget);
        assert.equal(environment.counters, 3);
        assert.equal(villain.damage, 0);
    });

    test('Norman replaces only his share of Squirrel Girl area damage', async () => {
        const {
            environment,
            factory,
            match,
            player,
            villain,
        } = await createRiskyBusinessGame();
        const scenarioData = await getRiskyBusiness();
        const hiredGunConfig = scenarioData.config.cards.find(({card}) =>
            card.params.name === 'Pistolero a sueldo').card;
        const hiredGun = factory.cardsFactory.createGameCardFromConfig(
            hiredGunConfig,
            {owner: player}
        );
        hiredGun.controller = player;
        hiredGun.refresh = async () => {};
        player.minions = [hiredGun];

        const {aspects} = await loadCatalog();
        const squirrelGirlConfig = aspects.find(({_id}) =>
            _id === 'leadership-squirrel-girl').card;
        const squirrelGirl = factory.cardsFactory.createGameCardFromConfig(
            squirrelGirlConfig,
            {owner: player}
        );
        const enterPlayAbility = squirrelGirl.abilities.find(ability =>
            ability.trigger === TRIGGER_THIS_ENTER_PLAY);
        assert.ok(enterPlayAbility);
        villain.currentSide.abilities.find(ability =>
            ability.trigger === TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE).hideDialog = true;

        await enterPlayAbility.resolveAbility({
            card: squirrelGirl,
            match,
            player,
            triggeredCard: squirrelGirl,
        });

        assert.equal(villain.damage, 0);
        assert.equal(hiredGun.damage, 1);
        assert.equal(environment.counters, 1);
    });

    test('Green Goblin replaces his scheme with removal of Madness counters', async () => {
        const {
            environment,
            match,
            player,
            villain,
        } = await createRiskyBusinessGame({
            environmentSide: 1,
            villainSide: 1,
        });
        const schemeInterrupt = villain.currentSide.abilities.find(ability =>
            ability.trigger === TRIGGER_VILLAIN_SCHEMES);
        schemeInterrupt.hideDialog = true;
        assert.ok(schemeInterrupt.effect instanceof ReplaceEffect);
        const operations = [];
        const removeCounters = environment.removeCounters.bind(environment);
        environment.removeCounters = count => {
            operations.push('remove-counters');
            return removeCounters(count);
        };
        const scheme = {
            character: villain,
            selectedTarget: match.scenario.mainScheme,
            isScheme: true,
            cancelled: false,
            cancel() {
                operations.push('cancel-scheme');
                this.cancelled = true;
            },
        };

        await match.trigger(
            PRIORITY_FORCED_INTERRUPT,
            [TRIGGER_VILLAIN_SCHEMES],
            {
                character: villain,
                effect: scheme,
                player,
            }
        );

        assert.equal(scheme.cancelled, true);
        assert.equal(environment.counters, 1);
        assert.deepEqual(operations, ['cancel-scheme', 'remove-counters']);
    });
});
