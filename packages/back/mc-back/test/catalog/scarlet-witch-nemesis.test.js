import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_BOOST,
    ABILITY_FORCED_RESPONSE,
    CALC_COUNT,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    DIALOG_USE_CARD,
    EFFECT_ACTIVATE,
    EFFECT_MODIFY_BOOST_ICONS,
    EFFECT_MODIFY_COST,
    EFFECT_TOUGH,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    PRIORITY_CONSTANT,
    PRIORITY_FORCED_RESPONSE,
    TARGET_VILLAIN,
    TARGET_YOU,
    TRAIT_ELITE,
    TRAIT_SPELL,
    TRIGGER_BOOST_ICONS_COUNTED,
    TRIGGER_PLAY_CARD,
    TRIGGER_THIS_ACTIVATES,
} from 'mc-shared';
import scarletWitch from '../../../mc-data/seed/catalog/heroes/scarlet-witch.js';
import rhino from '../../../mc-data/seed/catalog/scenarios/rhino.js';
import {CountBoostIconsEffect} from '../../src/effects/count-boost-icons-effect.js';
import {EngageEffect} from '../../src/effects/engage-effect.js';
import {EnemyActivationEffect} from '../../src/effects/enemy-activation-effect.js';
import {PlaceThreatEffect} from '../../src/effects/place-threat-effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {ResolveBoostEffect} from '../../src/effects/resolve-boost-effect.js';
import {Calc} from '../../src/engine/calc.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {TRIGGER_MAP} from '../../src/factory/triggers/triggers-map.js';
import {Match} from '../../src/model/match/match.js';
import {PlayCardTrigger} from '../../src/triggers/play-card-trigger.js';
import {ThisActivatesTrigger} from '../../src/triggers/this-activates-trigger.js';

describe('Scarlet Witch obligation and nemesis set', () => {
    async function createFixture() {
        const match = new Match({
            name: 'scarlet-witch-nemesis-test',
            mc: {mcSocket: {send() {}}},
        });
        match.persist = async () => {};
        match.refresh = async () => {};
        match.openDialog = async () => ({});

        const factory = new MatchFactory(match);
        const superhero = factory.createSuperhero({
            ...structuredClone(scarletWitch.config),
            precon: [],
        });
        superhero.selectedSide = 1;

        const player = match.createPlayer({
            name: 'Wanda Maximoff',
            initial: true,
            superhero,
        });
        player.initPlayer();
        match.currentPlayer = player;

        const scenario = await factory.createScenario({
            ...structuredClone(rhino.config),
            cards: [],
            sets: [],
            defaultSets: [],
        });
        match.addScenario(scenario);
        await scenario.initScenario([], false);
        match.phase = 'player';
        match.playing = true;

        return {factory, match, player, scenario, superhero};
    }

    function findNemesisCard(name) {
        return scarletWitch.config.nemesis.find(({card}) =>
            card.params.name === name).card;
    }

    test('defines and compiles the obligation and four-card nemesis set', async () => {
        const {factory, scenario} = await createFixture();
        const {obligation, nemesis} = scarletWitch.config;

        assert.equal(obligation.count, 2);
        assert.equal(obligation.card.type, CARD_TYPE_OBLIGATION);
        assert.equal(obligation.card.params.boost, 3);
        assert.equal(obligation.card.params.giveToOwner, true);
        assert.deepEqual(
            nemesis.map(({count, card}) => [card.params.name, count]),
            [
                ['La siguiente evolución', 1],
                ['Luminosa', 1],
                ['Suspensión mágica', 1],
                ['Manipulación del caos', 1],
            ]
        );

        for (const {card: config} of [
            obligation,
            ...nemesis,
        ]) {
            const gameCard = factory.cardsFactory.createGameCardFromConfig(
                structuredClone(config),
                {owner: scenario}
            );
            for (const ability of gameCard.abilities) {
                assert.ok(ability.effect);
                assert.equal(typeof ability.effect.canRun, 'function');
            }
        }

        const luminous = findNemesisCard('Luminosa');
        assert.equal(luminous.type, CARD_TYPE_MINION);
        assert.equal(luminous.params.nemesis, true);
        assert.equal(luminous.params.unique, true);
        assert.deepEqual(luminous.params.traits, [TRAIT_ELITE]);
        assert.deepEqual(
            [luminous.params.attack, luminous.params.scheme, luminous.params.hitPoints],
            [2, 2, 5]
        );
        assert.equal(
            luminous.params.abilities[0].type,
            ABILITY_FORCED_RESPONSE
        );
        assert.equal(
            luminous.params.abilities[0].params.trigger,
            TRIGGER_THIS_ACTIVATES
        );
    });

    test('the obligation counts cards with a boost ability, not numeric icons', async () => {
        const {factory, match, player, scenario} = await createFixture();
        const abilityCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_TREACHERY,
            params: {
                name: 'Carta con capacidad de Aumento',
                boost: 0,
                boostAbility: {
                    type: ABILITY_BOOST,
                    params: {
                        effect: {
                            type: EFFECT_TOUGH,
                            params: {target: TARGET_VILLAIN},
                        },
                    },
                },
            },
        }, {owner: scenario});
        const numericBoostCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_TREACHERY,
            params: {
                name: 'Carta con iconos numéricos',
                boost: 3,
            },
        }, {owner: scenario});

        assert.equal(abilityCard.hasBoostAbility, true);
        assert.equal(numericBoostCard.hasBoostAbility, false);
        const count = new Calc({
            target: 'effects.0.cards',
            formula: CALC_COUNT,
            conditions: {hasBoostAbility: true},
        }).calculate({
            effects: [{cards: [abilityCard, numericBoostCard]}],
        });
        assert.equal(count, 1);

        const obligationThreat = scarletWitch.config.obligation.card.params
            .abilities[1].params.effect.params.options[1].params.effect.params
            .effects[1];
        const threatEffect = new PlaceThreatEffect({
            ...structuredClone(obligationThreat.params),
            match,
        });
        const mainScheme = scenario.mainScheme;
        const initialThreat = mainScheme.threat;
        await threatEffect.runEffect({
            effects: [{cards: [abilityCard, numericBoostCard]}],
            match,
            player,
        });
        assert.equal(mainScheme.threat, initialThreat + 1);
    });

    test('La siguiente evolución adds one icon to regular counts and activation boosts', async () => {
        const {factory, match, player, scenario} = await createFixture();
        const schemeConfig = findNemesisCard('La siguiente evolución');
        assert.equal(schemeConfig.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.deepEqual(schemeConfig.params.startingThreat, [2, true]);
        assert.equal(
            schemeConfig.params.abilities[0].params.trigger,
            TRIGGER_BOOST_ICONS_COUNTED
        );
        assert.equal(
            schemeConfig.params.abilities[0].params.effect.type,
            EFFECT_MODIFY_BOOST_ICONS
        );

        const scheme = factory.cardsFactory.createGameCardFromConfig(
            structuredClone(schemeConfig),
            {owner: scenario}
        );
        await new PutPlayEffect({
            match,
            card: scheme,
            controller: scenario,
        }).runEffect({player, force: true});

        const countedCard = {
            id: 'counted-encounter-card',
            boost: 1,
            toObj() {
                return {id: this.id, boost: this.boost};
            },
        };
        const countEffect = new CountBoostIconsEffect({
            card: 'card',
            match,
            showDialog: false,
        });
        await countEffect.execute({card: countedCard, match, player});
        assert.equal(countEffect.value, 2);

        const boostEffect = new ResolveBoostEffect({
            card: countedCard,
            enemyActivation: {boostCards: [countedCard]},
            match,
        });
        boostEffect.boostValue = 1;
        await boostEffect.execute({match, player});
        assert.equal(boostEffect.value, 2);
    });

    test('Luminosa responds only after her own completed activation', async () => {
        const {factory, match, player, scenario} = await createFixture();
        match.openDialog = async dialog =>
            dialog.dialogType === DIALOG_USE_CARD ?
                {selected: dialog.data.cards[0]} :
                {};
        const luminous = factory.cardsFactory.createGameCardFromConfig(
            structuredClone(findNemesisCard('Luminosa')),
            {owner: scenario}
        );
        assert.equal(TRIGGER_MAP[TRIGGER_THIS_ACTIVATES], ThisActivatesTrigger);
        const scheme = factory.cardsFactory.createGameCardFromConfig(
            structuredClone(findNemesisCard('La siguiente evolución')),
            {owner: scenario}
        );
        await new PutPlayEffect({
            match,
            card: scheme,
            controller: scenario,
        }).runEffect({player, force: true});
        await new EngageEffect({
            card: luminous,
            match,
            target: TARGET_YOU,
        }).runEffect({match, player});

        const countedBoost = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_TREACHERY,
            params: {name: 'Aumento contado', boost: 1},
        }, {owner: scenario});
        const dealtEncounter = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_TREACHERY,
            params: {name: 'Carta de Encuentro repartida', boost: 0},
        }, {owner: scenario});
        const reserveEncounter = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_TREACHERY,
            params: {name: 'Otra carta de Encuentro', boost: 0},
        }, {owner: scenario});
        scenario.deck.cards.push(
            countedBoost,
            dealtEncounter,
            reserveEncounter
        );

        const activation = new EnemyActivationEffect({
            enemy: luminous,
            match,
            player,
        });

        activation.resolved = true;
        const triggerParams = activation.getTriggersParams({match, player});
        assert.ok(activation.getTriggersEnds(triggerParams)
            .includes(TRIGGER_THIS_ACTIVATES));
        const registeredTrigger = match.triggerCards[luminous.id]
            .triggers[TRIGGER_THIS_ACTIVATES][PRIORITY_FORCED_RESPONSE][0];
        assert.equal(await registeredTrigger.canTrigger(triggerParams), true);
        await activation.triggerEnds(triggerParams);
        assert.ok(scenario.deck.discardPile.includes(countedBoost));
        assert.ok(player.gameZone.encounters.includes(dealtEncounter));

        const trigger = new ThisActivatesTrigger({
            card: luminous,
            ability: {canTrigger: () => true},
            trigger: TRIGGER_THIS_ACTIVATES,
        });

        assert.equal(await trigger.canTrigger({effect: activation}), true);
        assert.equal(await trigger.canTrigger({
            effect: {...activation, character: {}},
        }), false);
        assert.equal(await trigger.canTrigger({
            effect: {...activation, resolved: false},
        }), false);
        assert.equal(await trigger.canTrigger({
            effect: {...activation, canceled: true},
        }), false);
    });

    test('Suspensión mágica scopes the play-cost modifier to its attached player', async () => {
        const {factory, match, player, scenario} = await createFixture();
        const suspensionConfig = findNemesisCard('Suspensión mágica');
        assert.equal(suspensionConfig.type, CARD_TYPE_ATTACHMENT);
        assert.deepEqual(suspensionConfig.params.traits, [TRAIT_SPELL]);
        assert.equal(
            suspensionConfig.params.abilities[0].params.trigger,
            TRIGGER_PLAY_CARD
        );
        assert.deepEqual(
            suspensionConfig.params.abilities[0].params.triggerParams,
            {player: 'ability.card.attachedTo.owner'}
        );
        assert.equal(
            suspensionConfig.params.abilities[0].params.effect.type,
            EFFECT_MODIFY_COST
        );

        const suspension = factory.cardsFactory.createGameCardFromConfig(
            structuredClone(suspensionConfig),
            {owner: scenario}
        );
        suspension.attachedTo = player.superhero;
        suspension.controller = scenario;
        scenario.gameZone.addToGameZone(suspension);
        await suspension.initTriggers({player});

        const playCard = new PlayCardEffect({
            match,
            card: player.deck.cards[0],
        });
        const trigger = match.triggerCards[suspension.id].triggers
            [TRIGGER_PLAY_CARD][PRIORITY_CONSTANT][0];
        assert.ok(trigger instanceof PlayCardTrigger);
        assert.equal(await trigger.canTrigger({match, player, effect: playCard}), true);
        assert.equal(await trigger.canTrigger({
            match,
            player: {id: 'other'},
            effect: playCard,
        }), false);
        await trigger.runTrigger({
            match,
            player,
            effect: playCard,
            card: playCard.card,
        });
        assert.equal(playCard.modifyCost, 1);
    });

    test('Manipulación del caos searches both encounter zones and activates Luminosa at two icons', async () => {
        const manipulation = findNemesisCard('Manipulación del caos');
        const effects = manipulation.params.abilities[0].params.effect.params.effects;
        const searchDeck = effects[0];
        const searchDiscard = effects[1].params.effectNot.params.effects[0];

        assert.equal(manipulation.type, CARD_TYPE_TREACHERY);
        assert.equal(manipulation.params.boost, 2);
        assert.deepEqual(searchDeck.params.locations, [
            PLACE_ENCOUNTER_DECK_CARDS,
        ]);
        assert.deepEqual(searchDiscard.params.locations, [
            PLACE_ENCOUNTER_DISCARD,
        ]);
        assert.equal(searchDeck.params.firstMatch, true);
        assert.equal(searchDiscard.params.firstMatch, true);
        assert.equal(effects[4].params.condition['effects.3.value'], '>1');
        assert.equal(effects[4].params.effect.type, EFFECT_ACTIVATE);
    });

    test('Manipulación del caos retrieves and engages Luminosa from the deck or discard', async () => {
        for (const location of ['deck', 'discard']) {
            const {factory, match, player, scenario} = await createFixture();
            const luminous = factory.cardsFactory.createGameCardFromConfig(
                structuredClone(findNemesisCard('Luminosa')),
                {owner: scenario}
            );
            if (location === 'deck') {
                scenario.deck.cards.push(luminous);
            } else {
                scenario.deck.discardPile.push(luminous);
            }

            const boostCard = factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_TREACHERY,
                params: {name: 'Carta superior', boost: 1},
            }, {owner: scenario});
            const reserveCard = factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_TREACHERY,
                params: {name: 'Carta de reserva', boost: 0},
            }, {owner: scenario});
            scenario.deck.cards.push(boostCard, reserveCard);
            const manipulation = factory.cardsFactory.createGameCardFromConfig(
                structuredClone(findNemesisCard('Manipulación del caos')),
                {owner: scenario}
            );
            await manipulation.abilities[0].resolveAbility({
                match,
                player,
                card: manipulation,
            });

            assert.equal(luminous.isInPlay, true);
            assert.equal(luminous.engaged, player);
            assert.ok(scenario.deck.discardPile.includes(boostCard));
            assert.equal(scenario.deck.cards.includes(luminous), false);
        }
    });
});
