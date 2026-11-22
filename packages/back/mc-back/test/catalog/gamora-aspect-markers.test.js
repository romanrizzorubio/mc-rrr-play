import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_EVENT,
    CLASSIFICATION_HERO,
    TARGET_PHASE,
    TRAIT_ATTACK,
    TRAIT_THWART,
    TRIGGER_PHASE_ENDS,
    TRIGGER_YOU_PLAY_CARD,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {PlayPhaseEffect} from '../../src/effects/play-phase-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {Match} from '../../src/model/match/match.js';
import {Superhero} from '../../src/model/match/superhero.js';
import {
    restoreMatch,
    serializeMatch,
} from '../../src/utils/match-serialization.js';

const createGamora = async () => {
    const catalog = await loadCatalog();
    const hero = catalog.heroes.find(({_id}) => _id === 'gamora');
    const match = new Match({
        mc: {},
        name: 'gamora-play-markers',
    });
    const cardsFactory = new CardsFactory({match});
    match.effectsFactory = cardsFactory.abilitiesFactory.effectsFactory;

    const superhero = new Superhero({
        sides: cardsFactory.createSides(hero.config.sides),
        heroCards: [],
        obligations: [],
        nemesis: [],
        deck: [],
        match,
    });
    const player = match.createPlayer({
        name: 'Gamora',
        superhero,
        config: hero.config,
    });
    player.deck = {async discard() {}};
    player.hand.refresh = async () => {};

    return {cardsFactory, catalog, hero, match, player, superhero};
};

const createEvent = (cardsFactory, player, traits) =>
    cardsFactory.createGameCardFromConfig({
        type: CARD_TYPE_EVENT,
        params: {
            name: 'Evento de prueba',
            set: 'Test',
            classification: CLASSIFICATION_HERO,
            traits,
            abilities: [],
        },
    }, {owner: player});

const playEvent = async (card, match, player) => {
    const effect = new PlayCardEffect({
        ability: {async resolveAbility() {}},
        card,
        match,
    });

    await effect.doPlay({match, player});
};

describe('Gamora aspect markers', () => {
    test('tracks event traits once and persists their outlines', async () => {
        const {cardsFactory, hero, match, player, superhero} =
            await createGamora();
        const attackEvent = createEvent(cardsFactory, player, [TRAIT_ATTACK]);
        const secondAttackEvent = createEvent(
            cardsFactory,
            player,
            [TRAIT_ATTACK]
        );
        const thwartEvent = createEvent(
            cardsFactory,
            player,
            [TRAIT_THWART]
        );

        assert.deepEqual(hero.config.aspectMarkerRules, {
            activateOn: TRIGGER_YOU_PLAY_CARD,
            deactivateOn: TRIGGER_PHASE_ENDS,
            eventsOnly: true,
            markersByTrait: {
                [TRAIT_ATTACK]: TRAIT_ATTACK,
                [TRAIT_THWART]: TRAIT_THWART,
            },
        });

        superhero.addAspectMarkersFromCard({
            isPlayerCard: true,
            isEvent: false,
            traits: [TRAIT_ATTACK],
        }, TRIGGER_YOU_PLAY_CARD);
        assert.deepEqual(superhero.toObj().aspectMarkers, []);

        await playEvent(attackEvent, match, player);
        await playEvent(secondAttackEvent, match, player);
        await playEvent(thwartEvent, match, player);

        assert.deepEqual(superhero.toObj().aspectMarkers, [
            TRAIT_ATTACK,
            TRAIT_THWART,
        ]);
        assert.equal(Object.hasOwn(superhero.toObj(), 'playedMarkers'), false);
        assert.equal(Object.hasOwn(superhero.toObj(), 'usedPlayedMarkers'), false);
        assert.deepEqual(superhero.toObj().outlinedAspectMarkers, []);

        const attackResponse = superhero.sides[1].abilities.find(({name}) =>
            name === 'Sutileza'
        );
        const thwartResponse = superhero.sides[1].abilities.find(({name}) =>
            name === 'Precisión'
        );
        assert.equal(attackResponse.aspectMarker, TRAIT_ATTACK);
        assert.equal(thwartResponse.aspectMarker, TRAIT_THWART);

        attackResponse.useLimit();
        assert.deepEqual(
            superhero.toObj().outlinedAspectMarkers,
            [TRAIT_ATTACK]
        );
        thwartResponse.useLimit();
        assert.deepEqual(superhero.toObj().outlinedAspectMarkers, [
            TRAIT_ATTACK,
            TRAIT_THWART,
        ]);

        player.deck = undefined;
        delete player.hand.refresh;
        const restoredMatch = restoreMatch(serializeMatch(match), {});
        assert.deepEqual(
            restoredMatch.players[0].superhero.toObj().outlinedAspectMarkers,
            [TRAIT_ATTACK, TRAIT_THWART]
        );
    });

    test('tracks Gamora’s fixed thwart event from its trait', async () => {
        const {cardsFactory, hero, match, player, superhero} =
            await createGamora();
        const eventConfig = hero.config.cards.find(({card}) =>
            card.params.name === 'Ímpetu'
        ).card;
        const event = cardsFactory.createGameCardFromConfig(
            eventConfig,
            {owner: player}
        );

        assert.deepEqual(event.traits, [TRAIT_THWART]);

        await playEvent(event, match, player);

        assert.deepEqual(superhero.toObj().aspectMarkers, [TRAIT_THWART]);
        const thwartResponse = superhero.sides[1].abilities.find(({name}) =>
            name === 'Precisión'
        );
        assert.equal(await thwartResponse.canRun({
            player,
            effect: {card: event},
        }, null), true);
    });

    test('does not treat a thwart label as the thwart trait', async () => {
        const {catalog, cardsFactory, match, player, superhero} =
            await createGamora();
        const eventConfig = catalog.aspects.find(({_id}) =>
            _id === 'protection-maniobra-enganosa'
        ).card;
        const event = cardsFactory.createGameCardFromConfig(
            eventConfig,
            {owner: player}
        );

        assert.equal(event.isEvent, true);
        assert.equal(event.traits?.includes(TRAIT_THWART), false);
        assert.equal(event.abilities.some(ability => ability.isThwart), true);

        await playEvent(event, match, player);

        assert.deepEqual(superhero.toObj().aspectMarkers, []);
        const thwartResponse = superhero.sides[1].abilities.find(({name}) =>
            name === 'Precisión'
        );
        assert.equal(await thwartResponse.canRun({
            player,
            effect: {card: event},
        }, null), false);
    });

    test('clears markers and outlines at the end of the phase', async () => {
        const {cardsFactory, match, player, superhero} = await createGamora();
        await playEvent(
            createEvent(cardsFactory, player, [TRAIT_ATTACK, TRAIT_THWART]),
            match,
            player
        );

        const attackResponse = superhero.sides[1].abilities.find(({name}) =>
            name === 'Sutileza'
        );
        const thwartResponse = superhero.sides[1].abilities.find(({name}) =>
            name === 'Precisión'
        );
        attackResponse.useLimit();
        thwartResponse.useLimit();

        const phase = new PlayPhaseEffect({match});
        await phase.execute({});

        assert.deepEqual(superhero.toObj().aspectMarkers, []);
        assert.deepEqual(superhero.toObj().outlinedAspectMarkers, []);
        assert.equal(attackResponse.limit.used, 0);
        assert.equal(thwartResponse.limit.used, 0);
        assert.equal(match.limits[TARGET_PHASE], undefined);
    });

    test('does not mark an event whose play was cancelled', async () => {
        const {cardsFactory, match, player, superhero} = await createGamora();
        const event = createEvent(cardsFactory, player, [TRAIT_ATTACK]);
        const ability = {
            paymentCancelled: false,
            async resolveAbility() {
                this.paymentCancelled = true;
            },
        };
        const effect = new PlayCardEffect({ability, card: event, match});

        await effect.doPlay({match, player});

        assert.deepEqual(superhero.toObj().aspectMarkers, []);
        assert.deepEqual(player.playedEventsThisTurn, []);
    });
});
