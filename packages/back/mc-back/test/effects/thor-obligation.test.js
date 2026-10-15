import assert from 'node:assert/strict';
import test from 'node:test';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

const createThorObligation = async () => {
    const {heroes} = await loadCatalog();
    const thor = heroes.find(hero => hero._id === 'thor');
    assert.ok(thor);

    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'thor-obligation-test',
    });
    const matchFactory = new MatchFactory(match);
    const superhero = matchFactory.createSuperhero(thor.config);
    superhero.selectedSide = 1;

    const player = match.createPlayer({
        name: 'Thor',
        superhero,
    });
    player.initPlayer();
    player.gameZone = new PlayerZone({owner: player});
    match.scenario = {
        gameZone: {searchCards: () => []},
        schemes: [],
        villain: {},
    };

    const obligation = superhero.obligations.find(card =>
        card.name === 'La ira de Odín');
    assert.ok(obligation);
    obligation.owner = player;
    let obligationDiscarded = false;
    obligation.discard = async () => {
        obligationDiscarded = true;
    };

    const resolver = obligation.abilities.find(ability =>
        ability.name === 'Resolver la obligación');
    const discardOption = resolver.effect.options.find(option =>
        option.name.startsWith('Descarta Mjolnir'));
    assert.ok(discardOption);

    const mjolnirConfig = thor.config.cards.find(({card}) =>
        card.params.name === 'Mjolnir').card;

    return {
        discardOption,
        matchFactory,
        mjolnirConfig,
        obligationDiscarded: () => obligationDiscarded,
        player,
        superhero,
        obligation,
    };
};

test('Thor obligation discards Mjolnir from play before stunning Thor', async () => {
    const {
        discardOption,
        matchFactory,
        mjolnirConfig,
        obligationDiscarded,
        player,
        superhero,
        obligation,
    } = await createThorObligation();
    player.gameZone.refresh = async () => {};
    player.deck.refresh = async () => {};
    superhero.refresh = async () => {};

    const mjolnir =
        matchFactory.cardsFactory.createGameCardFromConfig(mjolnirConfig);
    mjolnir.owner = player;
    player.addToGameZone(mjolnir);

    await discardOption.resolveAbility({card: obligation, player});

    assert.equal(player.gameZone.cards.includes(mjolnir), false);
    assert.equal(player.deck.discardPile.includes(mjolnir), true);
    assert.equal(superhero.isStunned, true);
    assert.equal(obligationDiscarded(), true);
});

test('Thor obligation discards Mjolnir from hand before stunning Thor', async () => {
    const {
        discardOption,
        matchFactory,
        mjolnirConfig,
        obligationDiscarded,
        player,
        superhero,
        obligation,
    } = await createThorObligation();
    player.deck.refresh = async () => {};
    superhero.refresh = async () => {};

    const mjolnir =
        matchFactory.cardsFactory.createGameCardFromConfig(mjolnirConfig);
    mjolnir.owner = player;
    player.hand.addCard(mjolnir);

    await discardOption.resolveAbility({card: obligation, player});

    assert.equal(player.hand.cards.includes(mjolnir), false);
    assert.equal(player.deck.discardPile.includes(mjolnir), true);
    assert.equal(superhero.isStunned, true);
    assert.equal(obligationDiscarded(), true);
});
