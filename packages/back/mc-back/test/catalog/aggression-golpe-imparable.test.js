import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CARD_TYPE_EVENT,
    CLASSIFICATION_AGGRESSION,
    EFFECT_DEAL_DAMAGE,
    LABEL_ATTACK,
    RESOURCE_PHYSICAL,
    TARGET_ENEMY,
    TRAIT_ATTACK,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';

describe('Golpe imparable', () => {
    test('is a physical-resource Aggression attack included three times in Spider-Woman precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const cardConfig = aspects.find(({_id}) =>
            _id === 'aggression-golpe-imparable');
        const spiderwoman = heroes.find(({_id}) => _id === 'spiderwoman');

        assert.ok(cardConfig);
        assert.ok(spiderwoman);
        assert.equal(cardConfig.aspect, CLASSIFICATION_AGGRESSION);
        assert.equal(cardConfig.card.type, CARD_TYPE_EVENT);
        assert.equal(cardConfig.card.params.name, 'Golpe imparable');
        assert.equal(
            cardConfig.card.params.set,
            CLASSIFICATION_AGGRESSION
        );
        assert.equal(
            cardConfig.card.params.image,
            'aspect/aggression/events/04044.png'
        );
        assert.deepEqual(cardConfig.card.params.traits, [TRAIT_ATTACK]);
        assert.equal(
            cardConfig.card.params.classification,
            CLASSIFICATION_AGGRESSION
        );
        assert.equal(cardConfig.card.params.cost, 2);
        assert.deepEqual(cardConfig.card.params.resources, [RESOURCE_PHYSICAL]);

        const preconCard = spiderwoman.config.precon
            .find(({aspect}) => aspect === CLASSIFICATION_AGGRESSION)
            .cardRefs.find(({id}) => id === cardConfig._id);
        assert.equal(preconCard.count, 3);

        const [abilityConfig] = cardConfig.card.params.abilities;
        assert.equal(abilityConfig.type, ABILITY_HERO_ACTION);
        assert.deepEqual(abilityConfig.params.labels, [LABEL_ATTACK]);
        assert.deepEqual(abilityConfig.params.effect, {
            type: EFFECT_DEAL_DAMAGE,
            params: {
                target: TARGET_ENEMY,
                damage: 3,
                keywords: {
                    piercing: true,
                },
            },
        });

        const matchFactory = new MatchFactory({triggerCards: {}});
        const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(
            cardConfig.card,
            {owner: {}}
        );
        const [ability] = gameCard.abilities;

        assert.equal(ability.isAttack, true);
        assert.ok(ability.effect instanceof DealDamageEffect);
        assert.equal(ability.effect.isAttack, true);
        assert.equal(ability.effect.baseDamage, 3);
        assert.equal(ability.effect.target, TARGET_ENEMY);
        assert.equal(ability.effect.piercing, true);
        assert.equal(typeof ability.effect.canRun, 'function');
    });

    test('deals its attack damage through an enemy Tough status', async () => {
        const {aspects, heroes} = await loadCatalog();
        const cardConfig = aspects.find(({_id}) =>
            _id === 'aggression-golpe-imparable');
        const spiderwoman = heroes.find(({_id}) => _id === 'spiderwoman');
        const matchFactory = new MatchFactory({
            mc: {mcSocket: {send() {}}},
            players: [],
            triggerCards: {},
        });
        const superhero = matchFactory.createSuperhero({
            ...spiderwoman.config,
            precon: [],
        });
        const heroSide = superhero.sides.find(({isHero}) => isHero);
        superhero.selectedSide = superhero.sides.indexOf(heroSide);
        const player = {
            isHero: true,
            isPlayer: true,
            name: 'Jessica Drew',
            superhero,
        };
        superhero.owner = player;
        matchFactory.match.players.push(player);

        const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(
            cardConfig.card,
            {owner: player}
        );
        const [ability] = gameCard.abilities;
        ability.prepareEffect({preselectedTarget: true});

        const enemy = {
            damage: 0,
            isEnemy: true,
            isInPlay: true,
            isTough: true,
            async getLife() {
                return 20 - this.damage;
            },
            placeDamage(damage) {
                this.damage += damage;
            },
            removeTough() {
                this.isTough = false;
            },
            async refresh() {},
        };
        ability.effect.selectedTarget = enemy;

        await ability.effect.runEffect({
            match: matchFactory.match,
            player,
        });

        assert.equal(ability.effect.piercing, true);
        assert.equal(enemy.damage, 3);
        assert.equal(enemy.isTough, false);
    });
});
