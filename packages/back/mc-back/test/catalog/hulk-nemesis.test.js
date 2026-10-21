import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_CONSTANT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    DIALOG_ACTIVATE,
    DIALOG_SELECT_TARGET,
    EFFECT_CANNOT_TARGET,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DO_IF,
    EFFECT_ENEMY_ATTACK,
    EFFECT_FOR_EACH,
    EFFECT_REMOVE_THREAT,
    EFFECT_SURGE,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ALL_ALLIES,
    TARGET_ENEMY,
    TARGET_HERO,
    TARGET_INITIAL_PLAYER,
    TRAIT_ELITE,
    TRAIT_GAMMA,
    TRIGGER_THIS_ATTACK,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {Attack} from '../../src/activations/attack.js';
import {ConstantAbility} from '../../src/abilities/misc/constant-ability.js';
import {ForcedResponseAbility} from '../../src/abilities/response/forced-response-ability.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {CannotTargetEffect} from '../../src/effects/cannot-target-effect.js';
import {DoIfEffect} from '../../src/effects/do-if-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {ForEachEffect} from '../../src/effects/for-each-effect.js';
import {SurgeEffect} from '../../src/effects/surge-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

test('Hulk nemesis cards and Abomination response match the supplied text', async () => {
    const {heroes} = await loadCatalog();
    const hulk = heroes.find(({_id}) => _id === 'hulk');
    const [abominationEntry, destructionEntry, duelEntry] = hulk.config.nemesis;
    const {card: abominationConfig, count: abominationCount} = abominationEntry;
    const {card: destructionConfig, count: destructionCount} = destructionEntry;

    assert.equal(abominationCount, 1);
    assert.equal(abominationConfig.type, CARD_TYPE_MINION);
    assert.equal(abominationConfig.params.name, 'Abominación');
    assert.equal(abominationConfig.params.image, 'heroes/hulk/10026.png');
    assert.equal(abominationConfig.params.unique, true);
    assert.equal(abominationConfig.params.nemesis, true);
    assert.deepEqual(abominationConfig.params.traits, [TRAIT_ELITE, TRAIT_GAMMA]);
    assert.equal(abominationConfig.params.attack, 3);
    assert.equal(abominationConfig.params.scheme, 2);
    assert.equal(abominationConfig.params.hitPoints, 6);
    assert.equal(abominationConfig.params.boost, 3);

    const [responseConfig] = abominationConfig.params.abilities;
    assert.equal(responseConfig.type, ABILITY_FORCED_RESPONSE);
    assert.equal(responseConfig.params.trigger, TRIGGER_THIS_ATTACK);

    const match = {triggerCards: {}};
    const cardsFactory = new CardsFactory({match});
    const abomination = cardsFactory.createGameCardFromConfig(
        abominationConfig,
        {owner: {}}
    );
    const [response] = abomination.abilities;

    assert.ok(response instanceof ForcedResponseAbility);
    assert.ok(response.effect instanceof ChainedEffect);
    const [discardTop, damageIfPhysical] = response.effect.effects;
    assert.equal(discardTop.effectType, EFFECT_DISCARD_FROM_DECK);
    assert.equal(damageIfPhysical.effectType, EFFECT_DO_IF);
    assert.equal(
        damageIfPhysical.checkCondition({
            effects: [{cards: [{resources: [RESOURCE_MENTAL, RESOURCE_PHYSICAL]}]}],
        }),
        true
    );
    assert.equal(
        damageIfPhysical.checkCondition({
            effects: [{cards: [{resources: [RESOURCE_MENTAL]}]}],
        }),
        false
    );
    assert.equal(damageIfPhysical.effect.damage, 2);

    assert.equal(destructionCount, 1);
    assert.equal(destructionConfig.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
    assert.equal(destructionConfig.params.name, 'Destrucción total');
    assert.equal(destructionConfig.params.image, 'heroes/hulk/10027.png');
    assert.equal(destructionConfig.params.unique, true);
    assert.deepEqual(destructionConfig.params.startingThreat, [2, true]);
    assert.equal(destructionConfig.params.boost, 3);

    let abominationInPlay;
    match.searchCard = condition =>
        condition.name === 'Abominación' ? abominationInPlay : undefined;
    const destruction = cardsFactory.createGameCardFromConfig(
        destructionConfig,
        {owner: {}}
    );
    const [constant] = destruction.abilities;

    assert.equal(destructionConfig.params.abilities[0].type, ABILITY_CONSTANT);
    assert.ok(constant instanceof ConstantAbility);
    assert.ok(constant.validation instanceof CannotTargetEffect);
    assert.equal(constant.validation.effectType, EFFECT_CANNOT_TARGET);

    abominationInPlay = abomination;
    const removeThreat = {effectType: EFFECT_REMOVE_THREAT};
    assert.equal(
        constant.validation.isInvalidTarget({
            effect: removeThreat,
            targetCard: destruction,
        }),
        true
    );
    assert.equal(
        constant.validation.isInvalidTarget({
            effect: {effectType: EFFECT_DEAL_DAMAGE},
            targetCard: destruction,
        }),
        false
    );

    abominationInPlay = undefined;
    assert.equal(
        constant.validation.isInvalidTarget({
            effect: removeThreat,
            targetCard: destruction,
        }),
        false
    );

    assert.equal(duelEntry.count, 3);
    assert.equal(duelEntry.card.type, CARD_TYPE_TREACHERY);
    assert.equal(duelEntry.card.params.name, 'Duelo de titanes');
    assert.equal(duelEntry.card.params.image, 'heroes/hulk/10028.png');
    assert.equal(duelEntry.card.params.boost, 3);
    const [duelAbilityConfig] = duelEntry.card.params.abilities;
    assert.equal(duelAbilityConfig.type, ABILITY_WHEN_REVEALED);
    assert.equal(duelAbilityConfig.params.effect.type, EFFECT_CHAINED);
    const [attackForInitialPlayer, surgeIfNoAttack] =
        duelAbilityConfig.params.effect.params.effects;
    assert.equal(attackForInitialPlayer.type, EFFECT_FOR_EACH);
    assert.equal(attackForInitialPlayer.params.target, TARGET_INITIAL_PLAYER);
    assert.equal(
        attackForInitialPlayer.params.effect.type,
        EFFECT_ENEMY_ATTACK
    );
    assert.equal(
        attackForInitialPlayer.params.effect.params.enemyType,
        TARGET_ENEMY
    );
    assert.deepEqual(
        attackForInitialPlayer.params.effect.params.target,
        [TARGET_HERO, TARGET_ALL_ALLIES]
    );
    assert.deepEqual(
        attackForInitialPlayer.params.effect.params.condition,
        {attack: {operator: 'max'}}
    );
    assert.equal(surgeIfNoAttack.type, EFFECT_DO_IF);
    assert.deepEqual(surgeIfNoAttack.params.condition, [
        {'effects.0.results.length': 0},
        {'effects.0.results.0.resolved': false},
    ]);
    assert.equal(surgeIfNoAttack.params.effect.type, EFFECT_SURGE);

    const duelCard = cardsFactory.createGameCardFromConfig(
        duelEntry.card,
        {owner: {}}
    );
    const [duelAbility] = duelCard.abilities;
    assert.ok(duelAbility.effect instanceof ChainedEffect);
    const [attackForInitialPlayerEffect, surgeIfNoAttackEffect] =
        duelAbility.effect.effects;
    assert.ok(attackForInitialPlayerEffect instanceof ForEachEffect);
    assert.ok(surgeIfNoAttackEffect instanceof DoIfEffect);
    assert.ok(surgeIfNoAttackEffect.effect instanceof SurgeEffect);
    assert.equal(typeof duelAbility.effect.canRun, 'function');
});

test('Duelo de titanes lets the first player choose among tied highest-ATK targets', async () => {
    const {heroes} = await loadCatalog();
    const hulk = heroes.find(({_id}) => _id === 'hulk');
    const duelConfig = hulk.config.nemesis[2].card;

    const makeCharacter = (id, attack, owner) => ({
        abilities: [],
        attack,
        id,
        isInPlay: true,
        name: id,
        owner,
        async getAttackValue() {
            return this.attack;
        },
        async getEffectiveStats({attack: attackOverride} = {}) {
            return {attack: attackOverride ?? this.attack};
        },
        toObj() {
            return {attack: this.attack, id: this.id, name: this.name};
        },
    });
    const firstPlayer = {
        allies: [],
        hand: {cards: []},
        isPlayer: true,
        name: 'Primer jugador',
    };
    const secondPlayer = {
        allies: [],
        hand: {cards: []},
        isPlayer: true,
        name: 'Segundo jugador',
    };
    const firstHero = makeCharacter('Hulk', 3, firstPlayer);
    const secondHero = makeCharacter('Héroe segundo', 2, secondPlayer);
    const tiedAlly = makeCharacter('El Vigía', 3, secondPlayer);
    const lowerAlly = makeCharacter('Aliado inferior', 1, firstPlayer);
    firstPlayer.superhero = {currentSide: firstHero};
    secondPlayer.superhero = {currentSide: secondHero};
    firstPlayer.allies.push(lowerAlly);
    secondPlayer.allies.push(tiedAlly);

    const tiedEnemyOne = makeCharacter('enemigo-uno', 4, {});
    const tiedEnemyTwo = makeCharacter('enemigo-dos', 4, {});
    const lowerEnemy = makeCharacter('enemigo-inferior', 2, {});
    const selectionDialogs = [];
    const match = {
        activationsFactory: {
            createActivation: () => ({
                filterTarget: () => true,
            }),
        },
        enemies: [tiedEnemyOne, tiedEnemyTwo, lowerEnemy],
        heroes: [firstPlayer, secondPlayer],
        initialPlayer: firstPlayer,
        players: [firstPlayer, secondPlayer],
        triggerCards: {},
        async openDialog(dialog) {
            if (dialog.dialogType === DIALOG_SELECT_TARGET) {
                selectionDialogs.push(dialog);
                const preferredId = selectionDialogs.length === 1 ?
                    tiedAlly.id :
                    tiedEnemyTwo.id;
                assert.ok(
                    dialog.data.cards.some(({id}) => id === preferredId),
                    `expected ${preferredId} among ${dialog.data.cards.map(({id}) => id)}`
                );

                return {selected: {id: preferredId}};
            }

            return {};
        },
    };
    const cardsFactory = new CardsFactory({match});
    match.effectsFactory = cardsFactory.abilitiesFactory.effectsFactory;
    const duel = cardsFactory.createGameCardFromConfig(
        duelConfig,
        {owner: secondPlayer}
    );
    const [ability] = duel.abilities;
    const forEach = ability.effect.effects[0];
    const attack = forEach.createTargetEffect();
    const params = forEach.getTargetParams(
        {ability, card: duel, match, player: secondPlayer},
        firstPlayer
    );

    assert.ok(attack instanceof EnemyAttackEffect);
    await attack.prepare(params);

    assert.equal(attack.selectedTarget, tiedAlly);
    assert.equal(attack.enemy, tiedEnemyTwo);
    assert.deepEqual(
        selectionDialogs.map(({data}) => data.cards.map(({id}) => id)),
        [
            [firstHero.id, tiedAlly.id],
            [tiedEnemyOne.id, tiedEnemyTwo.id],
        ]
    );
    assert.deepEqual(
        selectionDialogs.map(({title}) => title),
        ['Elige tu objetivo', 'Elige el atacante']
    );
    assert.deepEqual(
        selectionDialogs.map(({targetPlayer}) => targetPlayer),
        [firstPlayer.name, firstPlayer.name]
    );
});

test('Duelo de titanes gains surge if its attack cannot resolve', async () => {
    const {heroes} = await loadCatalog();
    const hulk = heroes.find(({_id}) => _id === 'hulk');
    const duelConfig = hulk.config.nemesis[2].card;

    for (const {name, enemies, hasHero} of [
        {name: 'no enemy', enemies: [], hasHero: true},
        {
            name: 'no hero or ally',
            enemies: [{abilities: [], attack: 3, isInPlay: true}],
            hasHero: false,
        },
    ]) {
        const player = {
            allies: [],
            hand: {cards: []},
            isPlayer: true,
            name: 'Jugador inicial',
        };
        const hero = {
            abilities: [],
            attack: 2,
            id: 'Héroe',
            isInPlay: true,
            name: 'Héroe',
            owner: player,
        };
        player.superhero = {currentSide: hero};
        const match = {
            activationsFactory: {
                createActivation: () => ({
                    filterTarget: () => true,
                }),
            },
            enemies,
            heroes: hasHero ? [player] : [],
            initialPlayer: player,
            players: [player],
            triggerCards: {},
            async openDialog() {
                return {};
            },
        };
        const cardsFactory = new CardsFactory({match});
        match.effectsFactory = cardsFactory.abilitiesFactory.effectsFactory;
        const duel = cardsFactory.createGameCardFromConfig(
            duelConfig,
            {owner: player}
        );
        const [ability] = duel.abilities;
        const reveal = {surge: false};

        await ability.effect.runEffect({
            card: duel,
            match,
            player,
            reveal,
        });

        assert.equal(reveal.surge, true, `expected surge when there is ${name}`);
    }
});

test('Duelo de titanes checks the wrapped attack result for surge', async () => {
    const {heroes} = await loadCatalog();
    const hulk = heroes.find(({_id}) => _id === 'hulk');
    const duelConfig = hulk.config.nemesis[2].card;
    const player = {
        allies: [],
        hand: {cards: []},
        isPlayer: true,
        name: 'Jugador inicial',
    };
    const match = {
        initialPlayer: player,
        players: [player],
        triggerCards: {},
        async openDialog() {
            return {};
        },
    };
    const cardsFactory = new CardsFactory({match});
    match.effectsFactory = cardsFactory.abilitiesFactory.effectsFactory;
    const duel = cardsFactory.createGameCardFromConfig(
        duelConfig,
        {owner: player}
    );
    const [ability] = duel.abilities;
    const [forEach, surgeIfNoAttack] = ability.effect.effects;
    const attemptedAttack = new EnemyAttackEffect({match});

    for (const {resolved, expectedSurge} of [
        {resolved: false, expectedSurge: true},
        {resolved: true, expectedSurge: false},
    ]) {
        attemptedAttack.resolved = resolved;
        forEach.results = [attemptedAttack];
        forEach.resolved = forEach.isResolved();
        const reveal = {surge: false};

        await surgeIfNoAttack.runEffect({
            effects: [forEach],
            match,
            player,
            reveal,
        });

        assert.equal(reveal.surge, expectedSurge);
    }
});

test('Duelo de titanes gains surge when the attack is skipped or canceled', async () => {
    const {heroes} = await loadCatalog();
    const hulk = heroes.find(({_id}) => _id === 'hulk');
    const duelConfig = hulk.config.nemesis[2].card;

    const runAttack = async ({stunned = false, canceled = false} = {}) => {
        const player = {
            allies: [],
            hand: {cards: []},
            isPlayer: true,
            name: 'Jugador inicial',
        };
        const createCharacter = (id, attack) => ({
            abilities: [],
            attack,
            id,
            isInPlay: true,
            name: id,
            owner: player,
            async getAttackValue() {
                return this.attack;
            },
            async getEffectiveStats({attack: attackOverride} = {}) {
                return {attack: attackOverride ?? this.attack};
            },
            toObj() {
                return {attack: this.attack, id: this.id, name: this.name};
            },
        });
        const hero = createCharacter('Héroe', 1);
        player.superhero = {currentSide: hero};
        const enemy = createCharacter('Villano', 3);
        enemy.isStunned = stunned;
        enemy.stunned = stunned ? 1 : 0;
        enemy.removeStunned = function() {
            this.isStunned = false;
            this.stunned = 0;
        };
        enemy.refresh = async () => {};
        const dialogs = [];
        const match = {
            activationsFactory: {
                createActivation: ({effect}) => new Attack({effect}),
            },
            enemies: [enemy],
            heroes: [player],
            initialPlayer: player,
            players: [player],
            triggerCards: {},
            async openDialog(dialog) {
                dialogs.push(dialog);

                return {};
            },
        };
        const cardsFactory = new CardsFactory({match});
        match.effectsFactory = cardsFactory.abilitiesFactory.effectsFactory;
        const duel = cardsFactory.createGameCardFromConfig(
            duelConfig,
            {owner: player}
        );
        const [ability] = duel.abilities;

        if (canceled) {
            const parseEffect = match.effectsFactory.parseEffect.bind(
                match.effectsFactory
            );
            match.effectsFactory.parseEffect = definition => {
                const effect = parseEffect(definition);
                if (definition.type === EFFECT_ENEMY_ATTACK) {
                    const trigger = effect.trigger.bind(effect);
                    effect.trigger = async (...args) => {
                        effect.cancel();

                        return trigger(...args);
                    };
                }

                return effect;
            };
        }

        const reveal = {surge: false};
        await ability.effect.runEffect({
            card: duel,
            match,
            player,
            reveal,
        });

        return {
            attackResult: ability.effect.effects[0].results[0],
            dialogs,
            enemy,
            reveal,
        };
    };

    const stunnedAttack = await runAttack({stunned: true});
    assert.equal(stunnedAttack.attackResult.resolved, false);
    assert.equal(stunnedAttack.enemy.isStunned, false);
    assert.equal(stunnedAttack.reveal.surge, true);
    assert.ok(stunnedAttack.dialogs.some(({dialogType, title}) =>
        dialogType === DIALOG_ACTIVATE && title === 'Activación omitida'));

    const canceledAttack = await runAttack({canceled: true});
    assert.equal(canceledAttack.attackResult.resolved, false);
    assert.equal(canceledAttack.reveal.surge, true);
});
