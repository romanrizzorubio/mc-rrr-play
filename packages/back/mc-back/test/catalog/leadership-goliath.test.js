import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ACTION,
    CARD_TYPE_ALLY,
    EFFECT_DISCARD_GAME,
    EFFECT_LASTING,
    EFFECT_MODIFY_ATTACK_VALUE,
    RESOURCE_MENTAL,
    TARGET_PHASE,
    TARGET_THIS,
    TIME_PHASE,
    TRAIT_AVENGER,
    TRIGGER_PHASE_ENDS,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {PlayPhaseEffect} from '../../src/effects/play-phase-effect.js';

describe('Goliat Leadership Ally', () => {
    test('defines Goliat and includes one copy in Hawkeye’s precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const goliat = aspects.find(({_id}) => _id === 'leadership-goliat');
        const hawkeye = heroes.find(({_id}) => _id === 'hawkeye');

        assert.ok(goliat);
        assert.ok(hawkeye);
        assert.equal(goliat.aspect, 'leadership');
        assert.equal(goliat.card.type, CARD_TYPE_ALLY);
        assert.equal(goliat.card.params.name, 'Goliat');
        assert.equal(goliat.card.params.subtitle, 'Bill Foster');
        assert.equal(
            goliat.card.params.image,
            'aspect/leadership/allies/04013.png'
        );
        assert.deepEqual(goliat.card.params.traits, [TRAIT_AVENGER]);
        assert.equal(goliat.card.params.unique, true);
        assert.equal(goliat.card.params.cost, 4);
        assert.deepEqual(goliat.card.params.resources, [RESOURCE_MENTAL]);
        assert.equal(goliat.card.params.hitPoints, 4);
        assert.equal(goliat.card.params.attack, 1);
        assert.equal(goliat.card.params.attackConsequential, 2);
        assert.equal(goliat.card.params.thwart, 2);
        assert.equal(goliat.card.params.thwartConsequential, 1);

        const action = goliat.card.params.abilities[0];
        assert.equal(action.type, ABILITY_ACTION);
        assert.equal(action.params.maximum.count, 1);
        assert.equal(action.params.maximum.target, TARGET_PHASE);
        assert.equal(action.params.effect.type, EFFECT_LASTING);
        assert.equal(action.params.effect.params.target, TARGET_THIS);
        assert.equal(action.params.effect.params.until, TIME_PHASE);
        assert.deepEqual(
            action.params.effect.params.effect,
            {
                type: EFFECT_MODIFY_ATTACK_VALUE,
                params: {target: TARGET_THIS, count: 4},
            }
        );
        assert.deepEqual(
            action.params.effect.params.endEffect,
            {
                type: EFFECT_DISCARD_GAME,
                params: {target: TARGET_THIS},
            }
        );

        const reference = hawkeye.config.precon
            .find(({aspect}) => aspect === 'leadership')
            .cardRefs.find(({id}) => id === goliat._id);
        assert.deepEqual(reference, {id: goliat._id, count: 1});
    });

    test('increases its ATK until phase end, then discards itself', async () => {
        const {aspects} = await loadCatalog();
        const goliat = aspects.find(({_id}) => _id === 'leadership-goliat');
        assert.ok(goliat);

        const match = {
            mc: {mcSocket: {send() {}}},
            players: [],
            triggerCards: {},
            lasting: [],
            limits: {},
        };
        const factory = new MatchFactory(match);
        const player = {
            isPlayer: true,
            name: 'Test player',
            gameZone: {
                cards: [],
                async discard(card) {
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
        match.players.push(player);

        const ally = factory.cardsFactory.createGameCardFromConfig(
            goliat.card,
            {owner: player}
        );
        ally.controller = player;
        ally.refresh = async () => {};
        player.gameZone.cards.push(ally);

        const action = ally.abilities.find(({effect}) =>
            effect?.effectType === EFFECT_LASTING);
        assert.ok(action);
        assert.equal(typeof action.effect.canRun, 'function');
        await action.resolveAbility({match, player, card: ally});

        assert.equal(await ally.getAttackValue({player}), 5);
        assert.equal(match.lasting.length, 1);
        assert.equal(action.maximum.canUse(), false);

        const phase = new PlayPhaseEffect({match});
        await phase.execute();
        phase.resolved = true;
        await phase.triggerEnds(
            {player},
            {triggerTypes: [TRIGGER_PHASE_ENDS]}
        );

        assert.equal(ally.modifyAttack, 0);
        assert.equal(player.gameZone.cards.includes(ally), false);
        assert.deepEqual(player.deck.discardPile, [ally]);
        assert.equal(match.lasting.length, 0);
    });
});
