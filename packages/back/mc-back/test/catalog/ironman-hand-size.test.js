import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {TRAIT_TECH} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {Player} from '../../src/model/match/player.js';

describe('Iron Man hand size', () => {
    test("does not apply Iron Man's Tech bonus to another player's hand", async () => {
        const catalog = await loadCatalog();
        const ironMan = catalog.heroes.find(({_id}) => _id === 'ironman');
        const captainAmerica = catalog.heroes.find(({_id}) =>
            _id === 'captain-america');
        const match = {
            currentRound: 1,
            dialogs: [],
            inPlayCards: [],
            lasting: [],
            limits: {},
            players: [],
            scenario: {},
            triggerCards: {},
        };
        const cardsFactory = new CardsFactory({match});
        match.effectsFactory = cardsFactory.abilitiesFactory.effectsFactory;

        const createPlayer = (hero, id) => {
            const superhero = cardsFactory.createCardSides(
                cardsFactory.createSides(hero.config.sides, id),
                id,
            );
            superhero.selectedSide = superhero.sides.findIndex(side =>
                side.isHero);

            const player = new Player({
                id,
                name: hero.name,
                superhero,
            });
            player.initGameZone();

            return player;
        };
        const ironManPlayer = createPlayer(ironMan, 'ironman-player');
        const captainAmericaPlayer = createPlayer(
            captainAmerica,
            'captain-america-player',
        );
        match.players = [ironManPlayer, captainAmericaPlayer];
        await Promise.all(match.players.map(player =>
            player.superhero.initTriggers()));

        const techUpgrades = ironMan.config.cards
            .filter(({card}) => card.params.traits?.includes(TRAIT_TECH))
            .slice(0, 3)
            .map(({card}, index) => cardsFactory.createGameCard({
                card: cardsFactory.createCard(card),
                index,
                owner: ironManPlayer,
            }));
        assert.equal(techUpgrades.length, 3);
        ironManPlayer.gameZone.cards.push(...techUpgrades);

        assert.equal(await ironManPlayer.getHandSize(), 4);
        assert.equal(await captainAmericaPlayer.getHandSize(), 5);
    });
});
