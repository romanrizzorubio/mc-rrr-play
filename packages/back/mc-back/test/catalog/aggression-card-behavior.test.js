import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_FORCED_RESPONSE,
    ABILITY_CONSTANT,
    ABILITY_HERO_RESPONSE,
    CALC_DAMAGE,
    CARD_TYPE_ALLY,
    CARD_TYPE_EVENT,
    EFFECT_DEAL_ENCOUNTER,
    EFFECT_DISCARD_GAME,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_REMOVE_THREAT,
    EFFECT_READY,
    EFFECT_SIMULTANEOUS,
    EFFECT_TAKE_DAMAGE,
    LABEL_THWART,
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    PRIORITY_RESPONSE,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_EFFECT,
    TARGET_SCHEME,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TRAIT_AVENGER,
    TRAIT_CHAMPION,
    TRAIT_GAMMA,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_CHARACTER_TAKES_DAMAGE,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_GET_ATTACK,
} from 'mc-shared';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {Attack} from '../../src/activations/attack.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {TriggersFactory} from '../../src/factory/triggers/triggers-factory.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

const createPlayer = (name, match, matchFactory, heroConfig) => {
    const superhero = matchFactory.createSuperhero(heroConfig);
    const player = match.createPlayer({name, superhero});
    player.gameZone = new PlayerZone({owner: player});
    player.gameZone.refresh = async () => {};
    superhero.refresh = async () => {};
    superhero.sides.forEach(side => {
        side.refresh = async () => {};
    });

    return player;
};

const createMatch = name => {
    const match = new Match({
        mc: {
            mcSocket: {
                send() {},
            },
        },
        name,
    });
    const matchFactory = new MatchFactory(match);

    return {match, matchFactory};
};

test('Vigor is included in Hulk precon and removes threat after it attacks', async () => {
    const catalog = await loadCatalog();
    const vigorConfig = catalog.aspects.find(({_id}) =>
        _id === 'aggression-vigor');
    const hulk = catalog.heroes.find(({_id}) => _id === 'hulk');
    assert.ok(vigorConfig);
    assert.ok(hulk);
    const preconCard = hulk.config.precon
        .find(({aspect}) => aspect === 'aggression')
        .cardRefs.find(({id}) => id === 'aggression-vigor');
    assert.ok(preconCard);
    const params = vigorConfig.card.params;
    const abilityConfig = params.abilities[0].params;

    assert.equal(preconCard.count, 1);
    assert.equal(vigorConfig.card.type, CARD_TYPE_ALLY);
    assert.equal(params.unique, true);
    assert.equal(params.name, 'Vigor');
    assert.equal(params.subtitle, 'Amadeus Cho');
    assert.equal(params.image, 'aspect/aggression/allies/10011.png');
    assert.deepEqual(params.traits, [TRAIT_CHAMPION, TRAIT_GAMMA]);
    assert.equal(params.cost, 3);
    assert.deepEqual(params.resources, [RESOURCE_MENTAL]);
    assert.equal(params.hitPoints, 5);
    assert.equal(params.attack, 1);
    assert.equal(params.thwart, 1);
    assert.equal(params.attackConsequential, 1);
    assert.equal(params.thwartConsequential, 1);
    assert.equal(abilityConfig.trigger, TRIGGER_THIS_ATTACK);
    assert.equal(abilityConfig.effect.type, EFFECT_REMOVE_THREAT);
    assert.equal(abilityConfig.effect.params.target, TARGET_SCHEME);

    const {match, matchFactory} = createMatch('vigor-attack-response');
    const player = createPlayer('Hulk', match, matchFactory, hulk.config);
    const scheme = {
        threat: 4,
        canRemoveThreat() {
            return true;
        },
        removeThreat(threat) {
            this.threat -= threat;
        },
        async refresh() {},
    };
    match.scenario = {schemes: [scheme]};

    const vigor = matchFactory.cardsFactory.createGameCardFromConfig(
        vigorConfig.card,
        {owner: player}
    );
    const ability = vigor.abilities.find(({trigger}) =>
        trigger === TRIGGER_THIS_ATTACK);
    vigor.controller = player;
    await vigor.initTriggers();

    assert.equal(ability.trigger, TRIGGER_THIS_ATTACK);
    assert.equal(typeof ability.effect.canRun, 'function');
    const attack = new Attack({
        effect: {
            ability: {isBasic: false},
            character: vigor,
            isAttack: true,
            match,
            selectedTarget: {name: 'Training minion'},
        },
    });
    const triggerParams = attack.getTriggersParams({
        effect: attack.effect,
        match,
        player,
    });
    const [trigger] = await match._getTriggers(
        attack.getTriggersEnds(triggerParams),
        PRIORITY_RESPONSE,
        triggerParams
    );

    assert.ok(trigger);
    await trigger.runTrigger(triggerParams);

    assert.equal(scheme.threat, 3);
});

test('¡Pagarás por eso! removes threat for damage suffered by Hulk from a villain attack, up to 5', async () => {
    const catalog = await loadCatalog();
    const cardConfig = catalog.aspects.find(({_id}) =>
        _id === 'aggression-pagaras-por-eso');
    const hulk = catalog.heroes.find(({_id}) => _id === 'hulk');
    assert.ok(cardConfig);
    assert.ok(hulk);

    const preconCard = hulk.config.precon
        .find(({aspect}) => aspect === 'aggression')
        .cardRefs.find(({id}) => id === cardConfig._id);
    assert.equal(preconCard.count, 3);
    assert.equal(cardConfig.card.type, CARD_TYPE_EVENT);
    assert.equal(cardConfig.card.params.name, '¡Pagarás por eso!');
    assert.equal(cardConfig.card.params.image, 'aspect/aggression/events/10016.png');
    assert.equal(cardConfig.card.params.cost, 1);
    assert.deepEqual(cardConfig.card.params.resources, [RESOURCE_ENERGY]);

    const [abilityConfig] = cardConfig.card.params.abilities;
    assert.equal(abilityConfig.type, ABILITY_HERO_RESPONSE);
    assert.deepEqual(abilityConfig.params.labels, [LABEL_THWART]);
    assert.equal(
        abilityConfig.params.trigger,
        TRIGGER_CHARACTER_TAKES_DAMAGE
    );
    assert.deepEqual(abilityConfig.params.triggerParams, {
        target: TARGET_YOUR_SUPERHERO,
    });
    assert.deepEqual(abilityConfig.params.condition, {
        'effect.isAttack': true,
        'effect.activation.character.isVillain': true,
    });
    assert.deepEqual(abilityConfig.params.effect, {
        type: EFFECT_REMOVE_THREAT,
        params: {
            target: TARGET_SCHEME,
            threat: 0,
            paramsCalc: {
                target: 'triggeredTargetDamage',
                max: 5,
            },
        },
    });

    const {match, matchFactory} = createMatch('pagaras-por-eso-damage');
    const player = createPlayer('Hulk', match, matchFactory, hulk.config);
    player.superhero.selectedSide = 1;
    const villain = {
        isEnemy: true,
        isVillain: true,
        name: 'Test Villain',
    };
    const scheme = {
        threat: 20,
        canRemoveThreat() {
            return this.threat > 0;
        },
        removeThreat(threat) {
            this.threat -= threat;
        },
        async refresh() {},
    };
    match.scenario = {
        schemes: [scheme],
        villain,
    };

    const card = matchFactory.cardsFactory.createGameCardFromConfig(
        cardConfig.card,
        {owner: player}
    );
    player.hand.addCard(card);
    const [ability] = card.abilities;
    const trigger = new TriggersFactory(match).createTrigger({
        ability,
        card,
        triggerParams: ability.triggerParams,
        type: ability.trigger,
    });

    const createDamageParams = (damage, {
        attacker = villain,
        target = player,
    } = {}) => {
        const attackEffect = new EnemyAttackEffect({
            enemy: attacker,
            match,
            selectedTarget: player,
        });
        const damageEffect = new TakeDamageEffect({
            activation: attackEffect.activation,
            damage,
            isAttack: true,
            match,
            selectedTarget: target,
        });

        return damageEffect.getTriggersParams({match, player});
    };

    const ally = {isAlly: true, owner: player};
    assert.equal(
        Boolean(await trigger.canTrigger(createDamageParams(0))),
        false
    );
    assert.equal(Boolean(await trigger.canTrigger(createDamageParams(3, {
        attacker: {isEnemy: true, isVillain: false},
    }))), false);
    assert.equal(Boolean(await trigger.canTrigger(createDamageParams(3, {
        target: ally,
    }))), false);

    const damageParams = createDamageParams(3);
    assert.equal(await trigger.canTrigger(damageParams), true);
    const abilityParams = trigger.getAbilityParams(damageParams);
    assert.equal(abilityParams.triggeredTargetDamage, 3);
    assert.equal(typeof ability.effect.canRun, 'function');
    await ability.effect.runEffect(abilityParams);
    assert.equal(scheme.threat, 17);

    const cappedDamageParams = createDamageParams(8);
    assert.equal(await trigger.canTrigger(cappedDamageParams), true);
    await ability.effect.runEffect(trigger.getAbilityParams(cappedDamageParams));
    assert.equal(scheme.threat, 12);
});

test('El Vigía is included in Hulk precon and deals an encounter card on entering play', async () => {
    const catalog = await loadCatalog();
    const vigiaConfig = catalog.aspects.find(({_id}) =>
        _id === 'aggression-el-vigia');
    const hulk = catalog.heroes.find(({_id}) => _id === 'hulk');
    assert.ok(vigiaConfig);
    assert.ok(hulk);
    const preconCard = hulk.config.precon
        .find(({aspect}) => aspect === 'aggression')
        .cardRefs.find(({id}) => id === 'aggression-el-vigia');
    assert.ok(preconCard);

    const {card} = vigiaConfig;
    const params = card.params;
    const abilityConfig = params.abilities[0];
    assert.equal(preconCard.count, 1);
    assert.equal(card.type, CARD_TYPE_ALLY);
    assert.equal(params.name, 'El Vigía');
    assert.equal(params.subtitle, 'Robert Reynolds');
    assert.equal(params.unique, true);
    assert.equal(params.image, 'aspect/aggression/allies/10012.png');
    assert.deepEqual(params.traits, [TRAIT_AVENGER]);
    assert.equal(params.cost, 4);
    assert.deepEqual(params.resources, [RESOURCE_ENERGY]);
    assert.equal(params.hitPoints, 5);
    assert.equal(params.attack, 3);
    assert.equal(params.thwart, 2);
    assert.equal(params.attackConsequential, 1);
    assert.equal(params.thwartConsequential, 1);
    assert.equal(abilityConfig.type, ABILITY_FORCED_RESPONSE);
    assert.equal(
        abilityConfig.params.trigger,
        TRIGGER_CARD_ENTER_PLAY
    );
    assert.deepEqual(abilityConfig.params.effect, {
        type: EFFECT_DEAL_ENCOUNTER,
        params: {
            target: TARGET_YOU,
            count: 1,
        },
    });

    const {match, matchFactory} = createMatch('vigia-enter-play-response');
    match.scenario = {
        gameZone: {
            cards: [],
            currentScheme: undefined,
        },
        villain: undefined,
    };
    match.openDialog = async ({data}) => ({
        selected: data.cards[0],
    });
    const player = createPlayer('Hulk', match, matchFactory, hulk.config);
    const vigia = matchFactory.cardsFactory.createGameCardFromConfig(
        card,
        {owner: player}
    );
    const ability = vigia.abilities[0];
    const encounterCard = {name: 'Encounter card'};
    let drawnCount;
    const dealtCards = [];
    match.drawEncounterCards = async count => {
        drawnCount = count;

        return [encounterCard];
    };
    player.gameZone.dealEncounterCard = cards => {
        dealtCards.push(...cards);
    };

    assert.equal(typeof ability.effect.canRun, 'function');
    await new PutPlayEffect({
        card: vigia,
        controller: player,
        match,
    }).runEffect({
        match,
        player,
        card: vigia,
    });

    assert.equal(vigia.controller, player);
    assert.equal(drawnCount, 1);
    assert.deepEqual(dealtCards, [encounterCard]);
});

test('Hulka is included in Hulk precon and gains ATQ for each damage on herself', async () => {
    const catalog = await loadCatalog();
    const hulkaConfig = catalog.aspects.find(({_id}) =>
        _id === 'aggression-hulka');
    const hulk = catalog.heroes.find(({_id}) => _id === 'hulk');
    assert.ok(hulkaConfig);
    assert.ok(hulk);
    const preconCard = hulk.config.precon
        .find(({aspect}) => aspect === 'aggression')
        .cardRefs.find(({id}) => id === 'aggression-hulka');
    assert.ok(preconCard);

    const {card} = hulkaConfig;
    const params = card.params;
    const abilityConfig = params.abilities[0];
    assert.equal(preconCard.count, 1);
    assert.equal(card.type, CARD_TYPE_ALLY);
    assert.equal(params.name, 'Hulka');
    assert.equal(params.subtitle, 'Jennifer Walters');
    assert.equal(params.unique, true);
    assert.equal(params.image, 'aspect/aggression/allies/10013.png');
    assert.deepEqual(params.traits, [TRAIT_AVENGER, TRAIT_GAMMA]);
    assert.equal(params.cost, 4);
    assert.deepEqual(params.resources, [RESOURCE_PHYSICAL]);
    assert.equal(params.hitPoints, 4);
    assert.equal(params.attack, 1);
    assert.equal(params.thwart, 2);
    assert.equal(params.attackConsequential, 1);
    assert.equal(params.thwartConsequential, 2);
    assert.equal(abilityConfig.type, ABILITY_CONSTANT);
    assert.equal(abilityConfig.params.trigger, TRIGGER_THIS_GET_ATTACK);
    assert.deepEqual(abilityConfig.params.effect, {
        type: EFFECT_MODIFY_ATTACK_VALUE,
        params: {
            target: TARGET_EFFECT,
            paramsCalc: {
                target: 'card',
                formula: CALC_DAMAGE,
            },
        },
    });

    const {match, matchFactory} = createMatch('hulka-damage-attack-value');
    const player = createPlayer('Hulk', match, matchFactory, hulk.config);
    const hulka = matchFactory.cardsFactory.createGameCardFromConfig(
        card,
        {owner: player}
    );
    hulka.controller = player;
    player.gameZone.addToGameZone(hulka);
    await hulka.initTriggers();

    const attackAbility = hulka.abilities.find(({trigger}) =>
        trigger === TRIGGER_THIS_GET_ATTACK);
    assert.ok(attackAbility);
    assert.equal(typeof attackAbility.effect.canRun, 'function');
    assert.equal(await hulka.getAttackValue({match, player}), 1);

    hulka.damage = 2;
    assert.equal(await hulka.getAttackValue({match, player}), 3);
});

test('Valkyrie payment automatically prefers energy for its enter-play ability', async () => {
    const catalog = await loadCatalog();
    const valkyrieConfig = catalog.aspects.find(({_id}) =>
        _id === 'aggression-valquiria');
    const thor = catalog.heroes.find(({_id}) => _id === 'thor');
    const {match, matchFactory} = createMatch('valkyrie-energy-payment');
    const player = createPlayer('Thor', match, matchFactory, thor.config);
    const valkyrie = matchFactory.cardsFactory.createGameCardFromConfig(
        valkyrieConfig.card,
        {owner: player}
    );
    const playCardEffect = new PlayCardEffect({
        card: valkyrie,
        match,
    });
    let paymentDialog;
    player.getCardsToPay = async () => ({
        generators: [],
        hand: [],
    });
    playCardEffect.getCost = async () => 1;
    playCardEffect.openDialog = async options => {
        paymentDialog = options;

        return {
            paid: {
                generators: [],
                hand: [],
            },
            resources: [RESOURCE_ENERGY],
        };
    };

    await playCardEffect.payCost({player});

    assert.deepEqual(
        paymentDialog.data.resourcePreferences,
        [RESOURCE_ENERGY]
    );
});

test('Hercules cost reduction works from hand, deck and discard', async () => {
    const catalog = await loadCatalog();
    const herculesConfig = catalog.aspects.find(({_id}) =>
        _id === 'aggression-hercules');
    const thor = catalog.heroes.find(({_id}) => _id === 'thor');
    const {match, matchFactory} = createMatch('hercules-hand-cost');
    const player = createPlayer('Thor', match, matchFactory, thor.config);
    const hercules = matchFactory.cardsFactory.createGameCardFromConfig(
        herculesConfig.card,
        {owner: player}
    );
    player.hand.addCard(hercules);
    player.minions.push({id: 'minion-1'}, {id: 'minion-2'});

    assert.equal(hercules.isInPlay, false);
    assert.equal(
        hercules.abilities.some(ability => ability.workInHand),
        true
    );

    const playCardEffect = new PlayCardEffect({
        card: hercules,
        match,
    });
    await playCardEffect.triggerInit(
        playCardEffect.getTriggersParams({match, player})
    );

    assert.equal(playCardEffect.modifyCost, -2);
    assert.equal(
        (await playCardEffect.getResourceCost({match, player})).amount,
        4
    );

    player.hand.discardHand(hercules);
    assert.equal(match.triggerCards[hercules.id], undefined);

    player.deck = {
        cards: [],
        discardPile: [],
        async refresh() {},
    };
    for (const place of [PLACE_DECK, PLACE_DISCARD_PILE]) {
        hercules.card.playFrom = [place];
        const sourceCards = place === PLACE_DECK ?
            player.deck.cards :
            player.deck.discardPile;
        sourceCards.push(hercules);

        const playFromPlaceEffect = new PlayCardEffect({
            card: hercules,
            match,
        });
        await playFromPlaceEffect.prepare({match, player});
        assert.equal(sourceCards.includes(hercules), false);

        await playFromPlaceEffect.triggerInit(
            playFromPlaceEffect.getTriggersParams({match, player})
        );
        assert.equal(playFromPlaceEffect.modifyCost, -2);
        assert.equal(
            (await playFromPlaceEffect.getResourceCost({match, player})).amount,
            4
        );

        await playFromPlaceEffect.returnToSource(player);
        assert.deepEqual(sourceCards, [hercules]);
        assert.equal(match.triggerCards[hercules.id], undefined);
        sourceCards.pop();
    }
});

test('Combat Fury pays damage and self-discard as arrow costs before readying the hero', async () => {
    const catalog = await loadCatalog();
    const combatFuryConfig = catalog.aspects.find(({_id}) =>
        _id === 'aggression-furia-de-combate');
    const thor = catalog.heroes.find(({_id}) => _id === 'thor');
    const abilityConfig = combatFuryConfig.card.params.abilities[0].params;
    assert.equal(abilityConfig.arrow.type, EFFECT_SIMULTANEOUS);
    assert.deepEqual(
        abilityConfig.arrow.params.effects.map(({type}) => type),
        [EFFECT_TAKE_DAMAGE, EFFECT_DISCARD_GAME]
    );
    assert.equal(abilityConfig.effect.type, EFFECT_READY);
    assert.equal(abilityConfig.effect.params.target, TARGET_YOUR_HERO);

    const {match, matchFactory} = createMatch('combat-fury-self-discard');
    const player = createPlayer('Thor', match, matchFactory, thor.config);
    const hero = player.superhero;
    hero.selectedSide = 1;
    hero.exhaust();

    const discardPile = [];
    player.deck = {
        discardPile,
        async discard(card) {
            discardPile.push(card);
        },
        async refresh() {},
    };

    const combatFury = matchFactory.cardsFactory.createGameCardFromConfig(
        combatFuryConfig.card,
        {owner: player}
    );
    combatFury.controller = player;
    player.gameZone.addToGameZone(combatFury);

    const ability = combatFury.abilities[0];
    await ability.resolveAbility({
        match,
        player,
        card: combatFury,
        effect: {
            selectedTarget: {
                isMinion: true,
            },
        },
    });

    assert.equal(ability.resolved, true);
    assert.equal(hero.damage, 1);
    assert.equal(hero.exhausted, false);
    assert.equal(player.gameZone.cards.includes(combatFury), false);
    assert.deepEqual(discardPile, [combatFury]);
});
