import assert from 'node:assert/strict';
import {test} from 'node:test';

import {DIALOG_DISCARD_HAND} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Deck} from '../../src/model/match/deck.js';
import {Match} from '../../src/model/match/match.js';

const createCard = id => ({
    id,
    isEvent: false,
    name: id,
    toObj() {
        return {id, name: this.name};
    },
});

const createHulkObligation = async ({selectedSide, handSize = 0}) => {
    const {heroes} = await loadCatalog();
    const hulk = heroes.find(hero => hero._id === 'hulk');
    assert.ok(hulk);

    const match = new Match({
        mc: {
            mcSocket: {
                send() {},
            },
        },
        name: `hulk-obligation-${selectedSide}-${handSize}`,
    });
    const matchFactory = new MatchFactory(match);
    const superhero = matchFactory.createSuperhero(hulk.config);
    superhero.selectedSide = selectedSide;

    const player = match.createPlayer({
        name: 'Hulk',
        superhero,
    });
    player.initPlayer();

    const scenario = {match};
    scenario.deck = new Deck({owner: scenario});
    scenario.deck.checkCycle = async () => {};
    scenario.deck.refresh = async () => {};
    match.scenario = scenario;

    player.deck.checkCycle = async () => {};
    player.deck.refresh = async () => {};
    player.gameZone.refresh = async () => {};
    player.hand.refresh = async () => {};
    superhero.refresh = async () => {};

    const [obligation] = superhero.obligations;
    assert.equal(obligation.name, 'Demonios interiores');
    obligation.owner = player;
    player.addToGameZone(obligation);

    const handCards = Array.from({length: handSize}, (_, index) =>
        createCard(`hand-${index}`));
    player.hand.cards = [];
    player.hand.addCards(handCards);

    const ability = obligation.abilities.find(({name}) =>
        name === 'Resolver la obligación');
    assert.ok(ability);
    assert.equal(typeof ability.effect.canRun, 'function');

    return {
        ability,
        handCards,
        match,
        obligation,
        player,
        scenario,
        superhero,
    };
};

test('Hulk obligation discards two cards when available and as many as possible otherwise', async () => {
    for (const handSize of [0, 1, 2]) {
        const {
            ability,
            handCards,
            match,
            obligation,
            player,
            scenario,
            superhero,
        } = await createHulkObligation({selectedSide: 1, handSize});
        let discardDialogCount = 0;

        match.openDialog = async ({dialogType, title, data}) => {
            assert.equal(dialogType, DIALOG_DISCARD_HAND);
            assert.equal(title, 'Descarta 2 cartas de tu mano');
            assert.equal(data.count, Math.min(handSize, 2));
            discardDialogCount += 1;

            return {
                selected: data.cards.map(({id}) => ({id})),
            };
        };

        await ability.resolveAbility({card: obligation, player});
        assert.equal(superhero.currentSide.name, 'Bruce Banner');
        assert.deepEqual(
            player.hand.cards.map(({id}) => id),
            [],
            `Hand should be empty after resolving with ${handSize} card(s)`
        );
        assert.deepEqual(
            player.deck.discardPile.filter(card => handCards.includes(card)),
            handCards
        );
        assert.equal(discardDialogCount, handSize ? 1 : 0);
        assert.equal(player.gameZone.cards.includes(obligation), false);
        assert.equal(scenario.deck.discardPile.includes(obligation), true);
    }
});

test('Hulk obligation flips to Hulk, exhausts him, and leaves play', async () => {
    const {
        ability,
        obligation,
        player,
        scenario,
        superhero,
    } = await createHulkObligation({selectedSide: 0});

    await ability.resolveAbility({card: obligation, player});

    assert.equal(superhero.currentSide.name, 'Hulk');
    assert.equal(player.exhausted, true);
    assert.equal(player.gameZone.cards.includes(obligation), false);
    assert.equal(scenario.deck.discardPile.includes(obligation), true);
});
