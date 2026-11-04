import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_CONSTANT,
    ABILITY_FORCED_RESPONSE,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_AGGRESSION,
    EFFECT_DISCARD_GAME,
    EFFECT_MODIFY_ATTACK,
    EFFECT_MODIFY_ATTACK_VALUE,
    PRIORITY_CONSTANT,
    PRIORITY_FORCED_RESPONSE,
    RESOURCE_MENTAL,
    TARGET_EFFECT,
    TARGET_ENEMY,
    TARGET_THIS,
    TRAIT_SKILL,
    TRIGGER_YOU_ATTACK,
    TRIGGER_YOU_BASIC_ATTACK,
    TRIGGER_YOUR_HERO_GET_ATTACK,
} from 'mc-shared';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {Attack} from '../../src/activations/attack.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

describe('Fuerza bruta', () => {
    const createMatch = name => {
        const match = new Match({
            mc: {
                mcSocket: {
                    send() {},
                },
            },
            name,
        });

        return {match, matchFactory: new MatchFactory(match)};
    };

    const createPlayer = (match, matchFactory, heroConfig) => {
        const superhero = matchFactory.createSuperhero(heroConfig);
        const player = match.createPlayer({name: 'Hulk', superhero});
        player.gameZone = new PlayerZone({owner: player});
        player.gameZone.refresh = async () => {};
        superhero.refresh = async () => {};
        superhero.sides.forEach(side => {
            side.refresh = async () => {};
        });
        const heroSide = superhero.sides.find(({isHero}) => isHero);
        superhero.selectedSide = superhero.sides.indexOf(heroSide);

        return player;
    };

    test('is in the shared Aggression collection, not in any precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const cardConfig = aspects.find(({_id}) =>
            _id === 'aggression-fuerza-bruta');

        assert.ok(cardConfig);
        assert.equal(cardConfig.aspect, CLASSIFICATION_AGGRESSION);
        assert.equal(cardConfig.card.type, CARD_TYPE_UPGRADE);
        assert.equal(cardConfig.card.params.name, 'Fuerza bruta');
        assert.equal(cardConfig.card.params.set, CLASSIFICATION_AGGRESSION);
        assert.equal(
            cardConfig.card.params.image,
            'aspect/aggression/upgrades/14029.png'
        );
        assert.deepEqual(cardConfig.card.params.traits, [TRAIT_SKILL]);
        assert.equal(cardConfig.card.params.cost, 1);
        assert.deepEqual(cardConfig.card.params.resources, [RESOURCE_MENTAL]);
        assert.equal(
            cardConfig.card.params.classification,
            CLASSIFICATION_AGGRESSION
        );

        const preconIds = heroes.flatMap(({config}) =>
            (config.precon ?? []).flatMap(({cardRefs = []}) =>
                cardRefs.map(({id}) => id)
            )
        );
        assert.equal(preconIds.includes(cardConfig._id), false);

        const [attackBonusConfig, piercingConfig, forcedDiscardConfig] =
            cardConfig.card.params.abilities;
        assert.equal(attackBonusConfig.type, ABILITY_CONSTANT);
        assert.equal(attackBonusConfig.params.trigger, TRIGGER_YOUR_HERO_GET_ATTACK);
        assert.equal(attackBonusConfig.params.effect.type, EFFECT_MODIFY_ATTACK_VALUE);
        assert.equal(piercingConfig.type, ABILITY_CONSTANT);
        assert.equal(piercingConfig.params.trigger, TRIGGER_YOU_ATTACK);
        assert.deepEqual(piercingConfig.params.condition, {
            'effect.ability.isBasic': true,
        });
        assert.equal(piercingConfig.params.effect.type, EFFECT_MODIFY_ATTACK);
        assert.deepEqual(piercingConfig.params.effect.params.modify, {
            keywords: {piercing: true},
        });
        assert.equal(forcedDiscardConfig.type, ABILITY_FORCED_RESPONSE);
        assert.equal(
            forcedDiscardConfig.params.trigger,
            TRIGGER_YOU_BASIC_ATTACK
        );
        assert.equal(
            forcedDiscardConfig.params.effect.type,
            EFFECT_DISCARD_GAME
        );
        assert.equal(forcedDiscardConfig.params.effect.params.target, TARGET_THIS);

        const {matchFactory} = createMatch('fuerza-bruta-card-factory');
        const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(
            cardConfig.card
        );
        const [attackBonus, piercing, forcedDiscard] = gameCard.abilities;

        assert.equal(attackBonus.trigger, TRIGGER_YOUR_HERO_GET_ATTACK);
        assert.equal(attackBonus.effect.effectType, EFFECT_MODIFY_ATTACK_VALUE);
        assert.equal(attackBonus.effect.target, TARGET_EFFECT);
        assert.equal(attackBonus.effect.count, 1);
        assert.equal(piercing.trigger, TRIGGER_YOU_ATTACK);
        assert.deepEqual(piercing.condition, {
            'effect.ability.isBasic': true,
        });
        assert.equal(piercing.effect.effectType, EFFECT_MODIFY_ATTACK);
        assert.equal(piercing.effect.target, TARGET_EFFECT);
        assert.deepEqual(piercing.effect.modify, {
            keywords: {piercing: true},
        });
        assert.equal(forcedDiscard.trigger, TRIGGER_YOU_BASIC_ATTACK);
        assert.equal(forcedDiscard.effect.effectType, EFFECT_DISCARD_GAME);
        assert.equal(forcedDiscard.effect.target, TARGET_THIS);
        assert.ok(gameCard.abilities.every(({effect}) =>
            typeof effect.canRun === 'function'
        ));
    });

    test('boosts Hero ATQ, grants Piercing only to basic attacks, then discards', async () => {
        const {aspects, heroes} = await loadCatalog();
        const cardConfig = aspects.find(({_id}) =>
            _id === 'aggression-fuerza-bruta');
        const hulk = heroes.find(({_id}) => _id === 'hulk');
        const {match, matchFactory} = createMatch('fuerza-bruta-runtime');
        const player = createPlayer(match, matchFactory, hulk.config);
        const hero = player.superhero.currentSide;
        const baseAttack = await hero.getAttackValue({match, player});
        player.deck = {
            async discard() {},
            async refresh() {},
        };
        const card = matchFactory.cardsFactory.createGameCardFromConfig(
            cardConfig.card,
            {owner: player}
        );
        player.addToGameZone(card);
        await card.initTriggers();

        assert.equal(
            await hero.getAttackValue({match, player}),
            baseAttack + 1
        );

        const discardedCards = [];
        player.deck.discard = async discardedCard => {
            discardedCards.push(discardedCard);
        };
        player.deck.refresh = async () => {};

        const enemy = {
            damage: 0,
            isEnemy: true,
            isInPlay: true,
            isTough: true,
            async getLife() {
                return 10 - this.damage;
            },
            async refresh() {},
            placeDamage(damage) {
                this.damage += damage;
            },
            removeTough() {
                this.isTough = false;
            },
        };
        const createAttack = isBasic => {
            const ability = {
                card: hero,
                isBasic,
                getAttackValue: params => hero.getAttackValue(params),
            };
            const effect = new DealDamageEffect({
                ability,
                character: hero,
                damage: 0,
                isAttack: true,
                match,
                selectedTarget: enemy,
                target: TARGET_ENEMY,
            });
            const activation = new Attack({effect});
            const params = activation.getTriggersParams({
                effect,
                match,
                player,
            });

            return {activation, effect, params};
        };
        const resolveConstants = async ({activation, params}) => {
            const triggers = await match._getTriggers(
                activation.getTriggersInit(params),
                PRIORITY_CONSTANT,
                params
            );
            for (const trigger of triggers) {
                await trigger.runTrigger(params);
            }
        };
        const nonBasicAttack = createAttack(false);

        await resolveConstants(nonBasicAttack);
        assert.equal(nonBasicAttack.effect.piercing, false);
        assert.equal(
            nonBasicAttack.activation
                .getTriggersEnds(nonBasicAttack.params)
                .includes(TRIGGER_YOU_BASIC_ATTACK),
            false
        );

        const basicAttack = createAttack(true);
        await resolveConstants(basicAttack);
        assert.equal(basicAttack.effect.piercing, true);

        await basicAttack.effect.execute(basicAttack.params);

        assert.equal(enemy.isTough, false);
        assert.equal(enemy.damage, baseAttack + 1);

        const attackEndTriggers = basicAttack.activation.getTriggersEnds(
            basicAttack.params
        );
        assert.ok(attackEndTriggers.includes(TRIGGER_YOU_BASIC_ATTACK));
        const forcedResponses = await match._getTriggers(
            attackEndTriggers,
            PRIORITY_FORCED_RESPONSE,
            basicAttack.params
        );
        assert.equal(forcedResponses.length, 1);
        await forcedResponses[0].runTrigger(basicAttack.params);

        assert.equal(card.isInPlay, false);
        assert.equal(player.gameZone.cards.includes(card), false);
        assert.deepEqual(discardedCards, [card]);
        assert.equal(
            await hero.getAttackValue({match, player}),
            baseAttack
        );
    });
});
