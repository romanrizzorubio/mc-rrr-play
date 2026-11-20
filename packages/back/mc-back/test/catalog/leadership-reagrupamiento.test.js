import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_FORCED_INTERRUPT,
    ABILITY_INTERRUPT,
    CARD_TYPE_ALLY,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_SUPPORT,
    CLASSIFICATION_LEADERSHIP,
    EFFECT_CHAINED,
    EFFECT_DISCARD_GAME,
    EFFECT_DEFEAT,
    EFFECT_PREVENT_DEFEAT,
    EFFECT_RETURN_HAND,
    DIALOG_USE_CARD,
    PRIORITY_FORCED_INTERRUPT,
    PRIORITY_INTERRUPT,
    RESOURCE_MENTAL,
    TARGET_ALL_ALLIES,
    TARGET_EFFECT,
    TARGET_THIS,
    TARGET_TRIGGERED_CARD,
    TRAIT_TACTIC,
    TRIGGER_CHARACTER_WOULD_BE_DEFEATED,
    TRIGGER_ROUND_ENDS,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {PlayRoundEffect} from '../../src/effects/play-round-effect.js';
import {PreventDefeatEffect} from '../../src/effects/prevent-defeat-effect.js';
import {ReturnHandEffect} from '../../src/effects/return-hand-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

describe('Reagrupamiento', () => {
    const createContext = async () => {
        const {aspects, heroes} = await loadCatalog();
        const definition = aspects.find(({_id}) =>
            _id === 'leadership-reagrupamiento');
        const hero = heroes.find(({_id}) => _id === 'ant-man');
        assert.ok(definition);
        assert.ok(hero);

        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'leadership-reagrupamiento',
        });
        match.openDialog = async ({dialogType, data}) =>
            dialogType === DIALOG_USE_CARD && data.cards?.length ?
                {selected: {id: data.cards[0].id}} :
                {};
        const factory = new MatchFactory(match);
        const createPlayer = (name, initial = false) => {
            const player = match.createPlayer({
                name,
                superhero: factory.createSuperhero({
                    ...hero.config,
                    cards: [],
                    precon: [],
                    nemesis: [],
                    obligation: undefined,
                }),
                initial,
            });
            player.initPlayer();
            player.gameZone = new PlayerZone({owner: player});
            player.gameZone.refresh = async () => {};
            player.hand.refresh = async () => {};

            return player;
        };
        const player = createPlayer('Ant-Man', true);
        const allyOwner = createPlayer('Otro jugador');
        const support = factory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player},
        );
        support.controller = player;
        player.gameZone.addToGameZone(support);
        await support.initTriggers();

        return {
            allyOwner,
            definition,
            factory,
            match,
            player,
            support,
        };
    };

    const createAlly = (factory, owner, controller, name) => {
        const ally = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {
                name,
                hitPoints: 2,
                attack: 1,
                thwart: 1,
            },
        }, {owner});
        ally.controller = controller;
        controller.gameZone.addToGameZone(ally);

        return ally;
    };

    test('registers the shared Leadership support without adding it to a precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const definition = aspects.find(({_id}) =>
            _id === 'leadership-reagrupamiento');

        assert.ok(definition);
        assert.equal(definition.aspect, CLASSIFICATION_LEADERSHIP);
        assert.equal(definition.order, 19032);
        assert.equal(definition.card.type, CARD_TYPE_SUPPORT);
        assert.equal(definition.card.params.name, 'Reagrupamiento');
        assert.equal(
            definition.card.params.image,
            'aspect/leadership/supports/19032.png',
        );
        assert.deepEqual(definition.card.params.traits, [TRAIT_TACTIC]);
        assert.equal(definition.card.params.cost, 1);
        assert.deepEqual(definition.card.params.resources, [RESOURCE_MENTAL]);
        assert.equal(definition.card.params.classification, CLASSIFICATION_LEADERSHIP);
        assert.deepEqual(
            heroes.some(({config}) =>
                config.precon?.some(({cardRefs}) =>
                    cardRefs.some(({id}) => id === definition._id),
                ),
            ),
            false,
        );

        const [interrupt, forcedInterrupt] = definition.card.params.abilities;
        assert.equal(interrupt.type, ABILITY_INTERRUPT);
        assert.equal(
            interrupt.params.trigger,
            TRIGGER_CHARACTER_WOULD_BE_DEFEATED,
        );
        assert.deepEqual(interrupt.params.triggerParams, {
            target: TARGET_ALL_ALLIES,
        });
        assert.deepEqual(interrupt.params.condition, {
            'effect.activation.effect.isEnemyAttack': true,
        });
        assert.equal(interrupt.params.effect.type, EFFECT_CHAINED);
        assert.deepEqual(interrupt.params.effect.params.effects, [
            {
                type: EFFECT_PREVENT_DEFEAT,
                params: {target: TARGET_EFFECT},
            },
            {
                type: EFFECT_RETURN_HAND,
                params: {
                    target: TARGET_TRIGGERED_CARD,
                    toOwner: true,
                },
            },
        ]);
        assert.equal(forcedInterrupt.type, ABILITY_FORCED_INTERRUPT);
        assert.equal(forcedInterrupt.params.trigger, TRIGGER_ROUND_ENDS);
        assert.deepEqual(forcedInterrupt.params.effect, {
            type: EFFECT_DISCARD_GAME,
            params: {target: TARGET_THIS},
        });
    });

    test('prevents an Ally defeated by an enemy attack and returns it to its owner', async () => {
        const {
            allyOwner,
            factory,
            match,
            player,
            support,
        } = await createContext();
        const ally = createAlly(
            factory,
            allyOwner,
            player,
            'Aliado de prueba',
        );
        const enemyAttack = new EnemyAttackEffect({
            enemy: {isInPlay: true, isVillain: true, name: 'Villano'},
            match,
        });
        const defeat = match.effectsFactory.createEffect({
            type: EFFECT_DEFEAT,
            selectedTarget: ally,
            activation: enemyAttack.activation,
        });
        const [interrupt] = support.abilities;

        assert.ok(defeat instanceof DefeatEffect);
        assert.ok(interrupt.effect instanceof ChainedEffect);
        assert.ok(interrupt.effect.effects[0] instanceof PreventDefeatEffect);
        assert.ok(interrupt.effect.effects[1] instanceof ReturnHandEffect);
        assert.equal(interrupt.effect.effects[1].toOwner, true);
        assert.equal(
            await interrupt.canTrigger({
                match,
                player,
                card: ally,
                effect: defeat,
                triggeredCard: ally,
                triggeredEffect: defeat,
            }),
            true,
        );

        await defeat.runEffect({match, player});

        assert.equal(defeat.prevented, true);
        assert.equal(defeat.defeated, false);
        assert.equal(allyOwner.hand.cards.includes(ally), true);
        assert.equal(player.hand.cards.includes(ally), false);
        assert.equal(player.gameZone.cards.includes(ally), false);
        assert.equal(allyOwner.deck.discardPile.includes(ally), false);
    });

    test('does not offer the interrupt for a defeat outside an enemy attack', async () => {
        const {factory, match, player, support} = await createContext();
        const ally = createAlly(factory, player, player, 'Aliado de prueba');
        const defeat = match.effectsFactory.createEffect({
            type: EFFECT_DEFEAT,
            selectedTarget: ally,
            activation: {effect: {isEnemyAttack: false}},
        });
        const [interrupt] = support.triggers[
            TRIGGER_CHARACTER_WOULD_BE_DEFEATED
        ][PRIORITY_INTERRUPT];

        assert.equal(
            await interrupt.canTrigger({
                match,
                player,
                card: ally,
                effect: defeat,
            }),
            false,
        );
    });

    test('preserves the controller-first default for other return-hand effects', async () => {
        const owner = {
            hand: {
                cards: [],
                addCards(cards) {
                    this.cards.push(...cards);
                },
                async refresh() {},
            },
        };
        const controller = {
            hand: {
                cards: [],
                addCards(cards) {
                    this.cards.push(...cards);
                },
                async refresh() {},
            },
        };
        const card = {
            controller,
            owner,
            isInPlay: false,
            async refresh() {},
        };
        const effect = new ReturnHandEffect({selectedTarget: card});

        await effect.execute();

        assert.deepEqual(controller.hand.cards, [card]);
        assert.deepEqual(owner.hand.cards, []);
    });

    test('discards the support at the end of the round', async () => {
        const {factory, match, player, support} = await createContext();
        const remainingCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name: 'Carta restante',
                resources: [RESOURCE_MENTAL],
            },
        }, {owner: player});
        player.deck.cards.push(remainingCard);
        const round = new PlayRoundEffect({match});

        assert.equal(
            support.triggers[TRIGGER_ROUND_ENDS][PRIORITY_FORCED_INTERRUPT].length,
            1,
        );
        await round.triggerEnds({match, player});

        assert.equal(player.gameZone.cards.includes(support), false);
        assert.equal(player.deck.discardPile.includes(support), true);
    });
});
