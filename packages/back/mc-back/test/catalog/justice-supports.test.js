import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_ACTION,
    CARD_TYPE_SUPPORT,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_GAME,
    EFFECT_EXHAUST,
    EFFECT_MOVE_THREAT,
    EFFECT_SIMULTANEOUS,
    RESOURCE_PHYSICAL,
    TARGET_MINION,
    TARGET_SCHEME,
    TARGET_THIS,
    TRAIT_PERSONA,
} from 'mc-shared';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

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

test('Policía de barrio is a shared Justice support with the supplied card data', async () => {
    const catalog = await loadCatalog();
    const support = catalog.aspects.find(({_id}) =>
        _id === 'justice-policia-de-barrio');

    assert.ok(support);
    assert.equal(support.aspect, 'justice');
    assert.equal(support.card.type, CARD_TYPE_SUPPORT);
    assert.equal(support.card.params.name, 'Policía de barrio');
    assert.equal(support.card.params.set, 'justice');
    assert.equal(support.card.params.image, 'aspect/justice/supports/10029.png');
    assert.deepEqual(support.card.params.traits, [TRAIT_PERSONA]);
    assert.equal(support.card.params.cost, 3);
    assert.deepEqual(support.card.params.resources, [RESOURCE_PHYSICAL]);
    assert.deepEqual(support.card.params.abilities.map(({type}) => type), [
        ABILITY_ACTION,
        ABILITY_ACTION,
    ]);
    assert.equal(catalog.heroes.some(({config}) =>
        config.precon?.some(({cardRefs = []}) =>
            cardRefs.some(({id}) => id === support._id))), false);
});

test('Policía de barrio moves scheme threat onto itself and spends it as minion damage', async () => {
    const catalog = await loadCatalog();
    const supportConfig = catalog.aspects.find(({_id}) =>
        _id === 'justice-policia-de-barrio');
    const thor = catalog.heroes.find(({_id}) => _id === 'thor');
    const {match, matchFactory} = createMatch('justice-policia-de-barrio');
    const player = createPlayer('Thor', match, matchFactory, thor.config);
    const discardedCards = [];
    player.deck = {
        async discard(card) {
            discardedCards.push(card);
        },
        async refresh() {},
    };

    const scheme = {
        isSideScheme: false,
        threat: 4,
        canRemoveThreat() {
            return this.threat > 0;
        },
        removeThreat(threat) {
            this.threat = Math.max(0, this.threat - threat);
        },
        async refresh() {},
    };
    match.scenario = {
        hasCrisis: false,
        schemes: [scheme],
        villain: undefined,
    };

    const minion = {
        damage: 0,
        hitPoints: 8,
        isMinion: true,
        isTough: false,
        name: 'Esbirro de prueba',
        async getLife() {
            return this.hitPoints - this.damage;
        },
        placeDamage(damage) {
            this.damage += damage;
        },
        async refresh() {},
    };
    player.minions.push(minion);

    const emptyThreatSupport = matchFactory.cardsFactory.createGameCardFromConfig(
        supportConfig.card,
        {index: 2, owner: player}
    );
    emptyThreatSupport.controller = player;
    emptyThreatSupport.refresh = async () => {};
    player.gameZone.addToGameZone(emptyThreatSupport);

    await emptyThreatSupport.abilities[1].resolveAbility({
        match,
        player,
        card: emptyThreatSupport,
    });

    assert.equal(minion.damage, 0);
    assert.equal(player.gameZone.cards.includes(emptyThreatSupport), false);
    assert.deepEqual(discardedCards, [emptyThreatSupport]);

    const support = matchFactory.cardsFactory.createGameCardFromConfig(
        supportConfig.card,
        {index: 1, owner: player}
    );
    support.controller = player;
    support.refresh = async () => {};
    player.gameZone.addToGameZone(support);

    assert.deepEqual(support.abilities.map(({name}) => name), [
        'Agota la Policía de barrio: traslada 1 de amenaza desde un plan hasta esta carta',
        'Agota y descarta la Policía de barrio: inflige tanto daño a un esbirro como la amenaza que haya sobre esta carta',
    ]);

    for (let activation = 0; activation < 2; activation++) {
        await support.abilities[0].resolveAbility({
            match,
            player,
            card: support,
        });
        support.ready();
    }

    assert.equal(scheme.threat, 2);
    assert.equal(support.threat, 2);
    assert.equal(support.counters, undefined);
    assert.equal(support.toObj().threat, 2);
    assert.equal(support.toObj().counters, undefined);

    for (const ability of support.abilities) {
        assert.equal(ability.isAction, true);
        assert.equal(Array.isArray(ability.effect), false);
        assert.equal(typeof ability.effect.canRun, 'function');
    }
    const [transferAbility, damageAbility] = support.abilities;
    assert.equal(transferAbility.effect.effectType, EFFECT_MOVE_THREAT);
    assert.equal(transferAbility.effect.fromTarget, TARGET_SCHEME);
    assert.equal(transferAbility.effect.target, TARGET_SCHEME);
    assert.equal(transferAbility.effect.toTarget, TARGET_THIS);
    assert.equal(damageAbility.effect.effectType, EFFECT_DEAL_DAMAGE);
    assert.equal(damageAbility.effect.target, TARGET_MINION);
    assert.equal(
        damageAbility.effect.paramsCalc.target,
        'effect.ability.arrow.cost.savedData.threat'
    );
    assert.equal(damageAbility.arrow.cost.effectType, EFFECT_SIMULTANEOUS);
    assert.deepEqual(
        damageAbility.arrow.cost.effects.map(effect => effect.effectType),
        [EFFECT_EXHAUST, EFFECT_DISCARD_GAME]
    );

    await damageAbility.resolveAbility({
        match,
        player,
        card: support,
    });

    assert.equal(minion.damage, 2);
    assert.deepEqual(discardedCards, [emptyThreatSupport, support]);
    assert.equal(player.gameZone.cards.includes(support), false);
    assert.equal(support.threat, 0);
});
