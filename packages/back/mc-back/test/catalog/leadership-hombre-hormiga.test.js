import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_CONSTANT,
    ABILITY_INTERRUPT,
    CARD_TYPE_ALLY,
    CARD_TYPE_RESOURCE,
    CLASSIFICATION_LEADERSHIP,
    CALC_COUNTERS,
    DIALOG_DISCARD_ORDER,
    DIALOG_PAY_COST,
    EFFECT_MODIFY_HIT_POINTS,
    EFFECT_PLACE_COUNTERS,
    RESOURCE_MENTAL,
    TARGET_THIS,
    TRAIT_AVENGER,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_CHARACTER_GET_HIT_POINTS,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

describe('Hombre Hormiga (Hank Pym)', () => {
    test('registers the Leadership ally in the Ant-Man precon with its printed stats and abilities', async () => {
        const catalog = await loadCatalog();
        const antMan = catalog.heroes.find(({_id}) => _id === 'ant-man');
        const definition = catalog.aspects.find(({_id}) =>
            _id === 'leadership-hombre-hormiga');

        assert.ok(antMan);
        assert.ok(definition);
        assert.equal(definition.aspect, CLASSIFICATION_LEADERSHIP);
        assert.deepEqual(
            antMan.config.precon.find(({aspect}) =>
                aspect === CLASSIFICATION_LEADERSHIP).cardRefs.find(({id}) =>
                id === definition._id),
            {id: definition._id, count: 1},
        );
        assert.equal(definition.card.type, CARD_TYPE_ALLY);
        assert.deepEqual(definition.card.params, {
            name: 'Hombre Hormiga',
            subtitle: 'Hank Pym',
            set: CLASSIFICATION_LEADERSHIP,
            image: 'aspect/leadership/allies/12011.png',
            traits: [TRAIT_AVENGER],
            unique: true,
            cost: 0,
            allowOverpay: true,
            resources: [RESOURCE_MENTAL],
            classification: CLASSIFICATION_LEADERSHIP,
            attack: 2,
            thwart: 2,
            attackConsequential: 1,
            thwartConsequential: 1,
            hitPoints: 0,
            abilities: [
                {
                    type: ABILITY_CONSTANT,
                    params: {
                        trigger: TRIGGER_CHARACTER_GET_HIT_POINTS,
                        effect: {
                            type: EFFECT_MODIFY_HIT_POINTS,
                            params: {
                                target: TARGET_THIS,
                                paramsCalc: {
                                    target: 'effect.ability.card',
                                    formula: CALC_COUNTERS,
                                },
                            },
                        },
                    },
                },
                {
                    type: ABILITY_INTERRUPT,
                    params: {
                        trigger: TRIGGER_CARD_ENTER_PLAY,
                        workInHand: true,
                        condition: {
                            'playCardEffect.resourcesOverpaid': '>0',
                        },
                        effect: {
                            type: EFFECT_PLACE_COUNTERS,
                            params: {
                                target: TARGET_THIS,
                                maxCounters: 4,
                                paramsCalc: {
                                    target: 'playCardEffect.resourcesOverpaid',
                                },
                            },
                        },
                    },
                },
            ],
        });

        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'leadership-hank-pym-catalog',
        });
        const cardsFactory = new MatchFactory(match).cardsFactory;
        const gameCard = cardsFactory.createGameCardFromConfig(definition.card);
        const healthAbility = gameCard.abilities.find(({trigger}) =>
            trigger === TRIGGER_CHARACTER_GET_HIT_POINTS);
        const counterAbility = gameCard.abilities.find(({trigger}) =>
            trigger === TRIGGER_CARD_ENTER_PLAY);
        assert.ok(healthAbility);
        assert.ok(counterAbility);
        assert.equal(healthAbility.effect.effectType, EFFECT_MODIFY_HIT_POINTS);
        assert.equal(counterAbility.effect.effectType, EFFECT_PLACE_COUNTERS);
        [healthAbility, counterAbility].forEach(({effect}) => {
            assert.equal(typeof effect.canRun, 'function');
        });
    });

    test('defeats immediately when it enters play with zero life', async () => {
        const catalog = await loadCatalog();
        const antMan = catalog.heroes.find(({_id}) => _id === 'ant-man');
        const definition = catalog.aspects.find(({_id}) =>
            _id === 'leadership-hombre-hormiga');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'leadership-hank-pym-zero-life',
        });
        match.scenario = {
            villain: undefined,
            gameZone: {
                currentScheme: undefined,
                cards: [],
            },
        };
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...antMan.config,
            cards: [],
            precon: [],
        });
        const player = match.createPlayer({
            name: 'Hombre Hormiga',
            superhero,
            initial: true,
        });
        player.gameZone = new PlayerZone({owner: player});
        player.gameZone.refresh = async () => {};
        player.hand.refresh = async () => {};
        player.deck = {
            cards: [],
            discardPile: [],
            async discard(card) {
                this.discardPile.push(card);
            },
            async refresh() {},
        };

        const ally = matchFactory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player},
        );
        ally.refresh = async () => {};
        player.hand.addCard(ally);

        const putPlayEffect = new PutPlayEffect({
            card: ally,
            controller: player,
            match,
        });
        await putPlayEffect.runEffect({match, player});

        assert.equal(await ally.getHitPoints({player}), 0);
        assert.equal(ally.isInPlay, false);
        assert.equal(player.gameZone.cards.includes(ally), false);
        assert.equal(player.deck.discardPile.includes(ally), true);
    });

    test('prompts at zero cost, pays excess resources, caps Pym counters, and adds matching hit points', async () => {
        const catalog = await loadCatalog();
        const antMan = catalog.heroes.find(({_id}) => _id === 'ant-man');
        const definition = catalog.aspects.find(({_id}) =>
            _id === 'leadership-hombre-hormiga');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'leadership-hank-pym-overpay',
        });
        match.scenario = {
            villain: undefined,
            gameZone: {
                currentScheme: undefined,
                cards: [],
            },
        };
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...antMan.config,
            cards: [],
            precon: [],
        });
        const player = match.createPlayer({
            name: 'Hombre Hormiga',
            superhero,
            initial: true,
        });
        player.gameZone = new PlayerZone({owner: player});
        player.gameZone.refresh = async () => {};
        player.hand.refresh = async () => {};
        player.deck = {
            cards: [],
            discardPile: [],
            async discard(card) {
                this.discardPile.push(card);
            },
            async refresh() {},
        };

        const ally = matchFactory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player},
        );
        ally.refresh = async () => {};
        player.hand.addCard(ally);

        const resources = Array.from({length: 6}, (_, index) =>
            matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_RESOURCE,
                params: {
                    name: `Recurso de prueba ${index + 1}`,
                    resources: [RESOURCE_MENTAL],
                },
            }, {
                index: index + 1,
                owner: player,
            }));
        resources.forEach(resource => player.hand.addCard(resource));

        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            if (dialog.dialogType === DIALOG_PAY_COST) {
                return {
                    paid: {
                        generators: [],
                        hand: resources.map(({id}) => ({id})),
                    },
                    resources: Array(resources.length).fill(RESOURCE_MENTAL),
                };
            }
            if (dialog.dialogType === DIALOG_DISCARD_ORDER) {
                return {
                    selected: resources.map(({id}) => ({id})),
                };
            }

            return {
                selected: dialog.data.options?.[0] ?? dialog.data.cards?.[0],
            };
        };

        const playEffect = new PlayCardEffect({card: ally, match});
        playEffect.modifyCost = -1;
        await playEffect.runEffect({match, player});

        const paymentDialog = dialogs.find(({dialogType}) =>
            dialogType === DIALOG_PAY_COST);
        assert.ok(paymentDialog);
        assert.equal(paymentDialog.data.cost, 0);
        assert.equal(paymentDialog.data.resourceSelectionMode, true);
        assert.equal(playEffect.played, true);
        assert.equal(playEffect.resourcesOverpaid, resources.length);
        assert.equal(playEffect.resourcesPaid.length, resources.length);
        assert.equal(ally.controller, player);
        assert.equal(ally.counters, 4);
        assert.equal(await ally.getHitPoints({player}), 4);
        assert.deepEqual(
            resources.filter(card => player.deck.discardPile.includes(card)).length,
            resources.length,
        );
    });
});
