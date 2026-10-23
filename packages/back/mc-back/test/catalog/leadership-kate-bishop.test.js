import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ACTION,
    CALC_PRINTED_RESOURCES,
    CARD_TYPE_ALLY,
    DIALOG_DISCARD_HAND,
    EFFECT_DEAL_DAMAGE,
    EFFECT_EXHAUST,
    EFFECT_SELECT_DISCARD_CARD,
    EFFECT_SIMULTANEOUS,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ENEMY,
    TARGET_THIS,
    TARGET_YOU,
    TRAIT_AVENGER,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

describe('Kate Bishop Leadership Ally', () => {
    test('is a unique Avenger Ally included once in Hawkeye’s precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const kateBishop = aspects.find(({_id}) =>
            _id === 'leadership-ojo-de-halcon-kate-bishop');
        const hawkeye = heroes.find(({_id}) => _id === 'hawkeye');

        assert.ok(kateBishop);
        assert.ok(hawkeye);
        assert.equal(kateBishop.aspect, 'leadership');
        assert.equal(kateBishop.card.type, CARD_TYPE_ALLY);
        assert.equal(kateBishop.card.params.name, 'Ojo de Halcón');
        assert.equal(kateBishop.card.params.subtitle, 'Kate Bishop');
        assert.equal(kateBishop.card.params.image, 'aspect/leadership/allies/04011.png');
        assert.deepEqual(kateBishop.card.params.traits, [TRAIT_AVENGER]);
        assert.equal(kateBishop.card.params.unique, true);
        assert.equal(kateBishop.card.params.cost, 2);
        assert.deepEqual(kateBishop.card.params.resources, [RESOURCE_PHYSICAL]);
        assert.equal(kateBishop.card.params.attack, 2);
        assert.equal(kateBishop.card.params.attackConsequential, 1);
        assert.equal(kateBishop.card.params.thwart, 1);
        assert.equal(kateBishop.card.params.thwartConsequential, 1);
        assert.equal(kateBishop.card.params.hitPoints, 2);
        assert.equal(kateBishop.card.params.abilities[0].type, ABILITY_ACTION);

        const reference = hawkeye.config.precon
            .find(({aspect}) => aspect === 'leadership')
            .cardRefs.find(({id}) => id === kateBishop._id);
        assert.deepEqual(reference, {id: kateBishop._id, count: 1});
    });

    test('counts only printed icons on El poder del liderazgo', async () => {
        const {aspects} = await loadCatalog();
        const kateBishop = aspects.find(({_id}) =>
            _id === 'leadership-ojo-de-halcon-kate-bishop');
        const leadershipPower = aspects.find(({_id}) =>
            _id === 'leadership-el-poder-del-liderazgo');
        assert.ok(kateBishop);
        assert.ok(leadershipPower);

        const enemy = {
            abilities: [],
            damage: 0,
            hitPoints: 10,
            id: 'test-enemy',
            isEnemy: true,
            isMinion: true,
            name: 'Test enemy',
            async getLife() {
                return this.hitPoints - this.damage;
            },
            canBeAttacked() {
                return true;
            },
            placeDamage(damage) {
                this.damage += damage;
            },
            async refresh() {},
        };
        const player = {
            isPlayer: true,
            gameZone: {
                cards: [],
                async refresh() {},
            },
            hand: {
                cards: [],
                async discardHand(card) {
                    this.cards = this.cards.filter(candidate => candidate !== card);
                },
                async refresh() {},
            },
            deck: {
                discardPile: [],
                async discard(card) {
                    this.discardPile.push(card);
                },
                async refresh() {},
            },
        };
        const match = {
            enemies: [enemy],
            triggerCards: {},
        };
        const cardsFactory = new CardsFactory({match});
        match.effectsFactory = cardsFactory.abilitiesFactory.effectsFactory;
        match.openDialog = async ({dialogType, data}) => {
            assert.equal(dialogType, DIALOG_DISCARD_HAND);
            assert.equal(data.count, 1);

            return {
                selected: [{id: discardedCard.id}],
            };
        };

        const ally = cardsFactory.createGameCardFromConfig(
            kateBishop.card,
            {owner: player}
        );
        ally.controller = player;
        ally.refresh = async () => {};
        player.gameZone.cards.push(ally);

        const discardedCard = cardsFactory.createGameCardFromConfig(
            leadershipPower.card,
            {owner: player}
        );
        assert.deepEqual(
            discardedCard.card.getPrintedResources(),
            [RESOURCE_WILD]
        );
        player.hand.cards.push(discardedCard);

        const ability = ally.abilities.find(({arrow}) =>
            arrow?.cost?.effectType === EFFECT_SIMULTANEOUS);
        assert.ok(ability);
        assert.equal(ability.name, 'Descarta una carta para infligir daño');
        assert.equal(ability.effect.effectType, EFFECT_DEAL_DAMAGE);
        assert.equal(ability.effect.isAttack, false);
        assert.equal(
            ability.effect.paramsCalc.formula,
            CALC_PRINTED_RESOURCES
        );
        assert.equal(ability.effect.paramsCalc.target,
            'effect.ability.arrow.cost.effects.1.cards');
        assert.equal(ability.arrow.cost.effectType, EFFECT_SIMULTANEOUS);
        assert.deepEqual(
            ability.arrow.cost.effects.map(effect => effect.effectType),
            [EFFECT_EXHAUST, EFFECT_SELECT_DISCARD_CARD]
        );
        assert.equal(ability.arrow.cost.effects[0].target, TARGET_THIS);
        assert.equal(ability.arrow.cost.effects[1].target, TARGET_YOU);
        assert.equal(typeof ability.effect.canRun, 'function');

        await ability.resolveAbility({match, player, card: ally});

        assert.equal(ally.exhausted, true);
        assert.deepEqual(player.hand.cards, []);
        assert.deepEqual(player.deck.discardPile, [discardedCard]);
        assert.equal(enemy.damage, 1);
        assert.equal(ally.damage, 0);
    });
});
