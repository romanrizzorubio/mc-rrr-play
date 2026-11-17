import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CARD_TYPE_EVENT,
    CLASSIFICATION_JUSTICE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DO_IF,
    LABEL_ATTACK,
    RESOURCE_PHYSICAL,
    TARGET_VILLAIN,
    TRAIT_ATTACK,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {DoIfEffect} from '../../src/effects/do-if-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';

describe('Punto de inflexión', () => {
    const createEffectContext = (cardConfig, threat) => {
        const match = {
            currentRound: 1,
            lasting: [],
            limits: {},
            players: [],
            scenario: {separatePlayAreas: true},
            triggerCards: {},
            numPlayers: 1,
            async openDialog() {
                return {};
            },
        };
        const matchFactory = new MatchFactory(match);
        const villain = {
            id: 'villain',
            isInPlay: true,
            isCard: true,
            isCharacter: true,
            isEnemy: true,
            isVillain: true,
            hitPoints: 20,
            damage: 0,
            getLife() {
                return this.hitPoints - this.damage;
            },
            canBeAttacked() {
                return true;
            },
            placeDamage(damage) {
                this.damage += damage;
                return damage;
            },
            async refresh() {},
        };
        const mainScheme = {
            id: 'main-scheme',
            isInPlay: true,
            isMainScheme: true,
            isCard: true,
            isScheme: true,
            threat,
            async refresh() {},
        };
        const scenarioZone = {
            currentScheme: {currentSide: mainScheme},
            currentVillain: villain,
        };
        const player = {
            isPlayer: true,
            isHero: true,
            match,
            scenarioZone,
            canAttack() {
                return true;
            },
        };
        match.players.push(player);
        match.mainScheme = {threat: threat === 0 ? 1 : 0};
        match.schemes = [mainScheme];
        match.villain = villain;

        const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(
            cardConfig,
            {owner: player}
        );

        return {gameCard, match, player, villain};
    };

    test('is a shared Justice attack event and is absent from every precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const definition = aspects.find(({_id}) =>
            _id === 'justice-punto-de-inflexion');

        assert.ok(definition);
        assert.equal(definition.aspect, CLASSIFICATION_JUSTICE);
        assert.equal(definition.card.type, CARD_TYPE_EVENT);
        assert.equal(definition.card.params.name, 'Punto de inflexión');
        assert.equal(definition.card.params.set, CLASSIFICATION_JUSTICE);
        assert.equal(
            definition.card.params.image,
            'aspect/justice/events/18029.png'
        );
        assert.deepEqual(definition.card.params.traits, [TRAIT_ATTACK]);
        assert.equal(definition.card.params.cost, 2);
        assert.deepEqual(definition.card.params.resources, [RESOURCE_PHYSICAL]);
        assert.equal(
            definition.card.params.classification,
            CLASSIFICATION_JUSTICE
        );

        const [abilityConfig] = definition.card.params.abilities;
        assert.equal(abilityConfig.type, ABILITY_HERO_ACTION);
        assert.deepEqual(abilityConfig.params.labels, [LABEL_ATTACK]);
        assert.deepEqual(abilityConfig.params.effect, {
            type: EFFECT_DO_IF,
            params: {
                target: TARGET_VILLAIN,
                condition: {
                    'player.scenarioZone.currentScheme.currentSide.threat': 0,
                },
                effect: {
                    type: EFFECT_DEAL_DAMAGE,
                    params: {target: TARGET_VILLAIN, damage: 5},
                },
                effectNot: {
                    type: EFFECT_DEAL_DAMAGE,
                    params: {target: TARGET_VILLAIN, damage: 2},
                },
            },
        });

        const preconIds = heroes.flatMap(({config}) =>
            (config.precon ?? []).flatMap(({cardRefs = []}) =>
                cardRefs.map(({id}) => id)
            )
        );
        assert.equal(preconIds.includes(definition._id), false);
    });

    test('deals 5 damage with no main-scheme threat and 2 otherwise', async () => {
        const {aspects} = await loadCatalog();
        const cardConfig = aspects.find(({_id}) =>
            _id === 'justice-punto-de-inflexion').card;

        for (const {threat, expectedDamage} of [
            {threat: 0, expectedDamage: 5},
            {threat: 1, expectedDamage: 2},
        ]) {
            const {gameCard, match, player, villain} =
                createEffectContext(cardConfig, threat);
            const [ability] = gameCard.abilities;
            const effect = ability.effect;

            assert.equal(ability.isAttack, true);
            assert.ok(effect instanceof DoIfEffect);
            assert.equal(typeof effect.canRun, 'function');
            assert.ok(effect.effect instanceof DealDamageEffect);
            assert.ok(effect.effectNot instanceof DealDamageEffect);
            assert.equal(effect.effect.effectType, EFFECT_DEAL_DAMAGE);
            assert.equal(effect.effectNot.effectType, EFFECT_DEAL_DAMAGE);
            effect.selectedTarget = villain;

            await effect.runEffect({
                ability,
                card: gameCard,
                match,
                player,
            });

            assert.equal(villain.damage, expectedDamage);
        }
    });
});
