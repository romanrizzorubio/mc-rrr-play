import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_EVENT,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_HERO,
    TRIGGER_ROUND_ENDS,
    TRIGGER_YOU_PLAY_CARD,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {PlayRoundEffect} from '../../src/effects/play-round-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {Engine} from '../../src/engine/engine.js';
import {Match} from '../../src/model/match/match.js';
import {Superhero} from '../../src/model/match/superhero.js';
import {
    restoreMatch,
    serializeMatch,
} from '../../src/utils/match-serialization.js';

const createSpiderwoman = async () => {
    const catalog = await loadCatalog();
    const hero = catalog.heroes.find(({_id}) => _id === 'spiderwoman');
    const match = new Match({
        mc: {},
        name: 'spiderwoman-aspect-markers',
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
        name: 'Spiderwoman',
        superhero,
        config: hero.config,
    });
    player.deck = {async discard() {}};
    player.hand.refresh = async () => {};

    return {cardsFactory, hero, match, player, superhero};
};

const createEvent = (cardsFactory, classification) =>
    cardsFactory.createGameCardFromConfig({
        type: CARD_TYPE_EVENT,
        params: {
            name: 'Carta de prueba',
            set: 'Test',
            classification,
            abilities: [],
        },
    });

const playEvent = async (card, match, player) => {
    const effect = new PlayCardEffect({
        ability: {async resolveAbility() {}},
        card,
        match,
    });

    await effect.doPlay({match, player});
};

describe('Spiderwoman aspect markers', () => {
    test('does not track aspects when the hero has no marker rules', async () => {
        const {cardsFactory, match, player, superhero} =
            await createSpiderwoman();
        player.config = {};

        await playEvent(
            createEvent(cardsFactory, [CLASSIFICATION_HERO, 'aggression']),
            match,
            player
        );

        assert.deepEqual(superhero.aspectMarkers, []);
        assert.equal(Object.hasOwn(superhero.toObj(), 'aspectMarkers'), false);
    });

    test('records one marker per distinct aspect played and persists it', async () => {
        const {cardsFactory, hero, match, player, superhero} =
            await createSpiderwoman();

        assert.deepEqual(hero.config.aspectMarkerRules, {
            activateOn: TRIGGER_YOU_PLAY_CARD,
            deactivateOn: TRIGGER_ROUND_ENDS,
        });

        await playEvent(
            createEvent(cardsFactory, [CLASSIFICATION_HERO, 'aggression']),
            match,
            player
        );
        await playEvent(
            createEvent(cardsFactory, [CLASSIFICATION_HERO, 'aggression']),
            match,
            player
        );
        await playEvent(
            createEvent(cardsFactory, [CLASSIFICATION_HERO, 'justice']),
            match,
            player
        );
        await playEvent(
            createEvent(cardsFactory, CLASSIFICATION_BASIC),
            match,
            player
        );
        await playEvent(
            createEvent(cardsFactory, CLASSIFICATION_HERO),
            match,
            player
        );

        assert.deepEqual(superhero.aspectMarkers, ['aggression', 'justice']);
        assert.deepEqual(superhero.toObj().aspectMarkers, [
            'aggression',
            'justice',
        ]);

        player.deck = undefined;
        delete player.hand.refresh;
        const restoredMatch = restoreMatch(serializeMatch(match), {});
        assert.deepEqual(
            restoredMatch.players[0].superhero.aspectMarkers,
            ['aggression', 'justice']
        );
    });

    test('clears configured markers at the end of the round', async () => {
        const {cardsFactory, match, player, superhero} =
            await createSpiderwoman();
        await playEvent(
            createEvent(cardsFactory, [CLASSIFICATION_HERO, 'aggression']),
            match,
            player
        );
        match.phase = 'villain';
        match.playing = true;
        match.persist = async () => {};
        match.refresh = async () => {};

        const previousRound = Engine.currentRound;
        const effect = new PlayRoundEffect({match});
        effect.villainPhase.runEffect = async () => {};
        effect.endLimit = async () => {};

        try {
            await effect.execute({});
        } finally {
            Engine.currentRound = previousRound;
        }

        assert.deepEqual(superhero.aspectMarkers, []);
        assert.deepEqual(superhero.toObj().aspectMarkers, []);
    });
});
