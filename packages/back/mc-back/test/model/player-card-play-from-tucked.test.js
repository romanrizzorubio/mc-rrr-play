import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {PLACE_TUCKED, TRAIT_ARROW} from 'mc-shared';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {GameCard} from '../../src/model/cards/game-card.js';
import {PlayerCard} from '../../src/model/printed/player-card.js';
import {
    findPlayerCardToPlayFrom,
    getPlayerCardLocation,
} from '../../src/utils/player-card-play-from.js';

const createGameCard = (params, owner, id) => {
    const card = new PlayerCard(params);
    card.isEvent = params.isEvent ?? false;
    const gameCard = new GameCard({card, owner});
    gameCard.id = id;

    return gameCard;
};

const createPlayer = () => ({
    hand: {
        cards: [],
        async refresh() {},
    },
    deck: {
        cards: [],
        discardPile: [],
        async refresh() {},
    },
    superhero: {
        heroCards: [],
        tuckedCards: [],
        getAttachedCards: () => [],
    },
    gameZone: {
        cards: [],
    },
});

describe('playing cards from tucked locations', () => {
    test('a host condition grants play permission only to matching tucked cards', async () => {
        const player = createPlayer();
        const quiver = createGameCard({
            name: 'Quiver',
            playTuckedCardsCondition: {
                isEvent: true,
                traits: TRAIT_ARROW,
            },
        }, player, 'quiver');
        const arrowEvent = createGameCard({
            name: 'Arrow Event',
            isEvent: true,
            traits: [TRAIT_ARROW],
        }, player, 'arrow-event');
        const ordinaryEvent = createGameCard({
            name: 'Ordinary Event',
            isEvent: true,
        }, player, 'ordinary-event');
        const otherHost = createGameCard({
            name: 'Other Host',
        }, player, 'other-host');
        const arrowUnderOtherHost = createGameCard({
            name: 'Another Arrow Event',
            isEvent: true,
            traits: [TRAIT_ARROW],
        }, player, 'another-arrow-event');
        quiver.tuckedCards.push(arrowEvent, ordinaryEvent);
        otherHost.tuckedCards.push(arrowUnderOtherHost);
        player.gameZone.cards.push(quiver, otherHost);

        assert.deepEqual(getPlayerCardLocation(arrowEvent, player), {
            place: PLACE_TUCKED,
            cards: quiver.tuckedCards,
            index: 0,
            player,
            host: quiver,
        });
        assert.equal(
            findPlayerCardToPlayFrom(player, arrowEvent.id),
            arrowEvent
        );
        assert.equal(
            arrowEvent.card.canPlay({gameCard: arrowEvent, player}),
            true
        );
        assert.equal(
            findPlayerCardToPlayFrom(player, ordinaryEvent.id),
            undefined
        );
        assert.equal(
            findPlayerCardToPlayFrom(player, arrowUnderOtherHost.id),
            undefined
        );

        const hostView = await quiver.toObjWithAbilityAvailability(player);
        assert.equal(
            hostView.tuckedCards.find(({id}) => id === arrowEvent.id).playable,
            true
        );
        assert.equal(
            hostView.tuckedCards.find(({id}) => id === ordinaryEvent.id).playable,
            false
        );
    });

    test('a cancelled play returns the card to the same tucked host and position', async () => {
        const player = createPlayer();
        const host = createGameCard({
            name: 'Quiver',
            playTuckedCardsCondition: {
                isEvent: true,
                traits: TRAIT_ARROW,
            },
        }, player, 'quiver');
        const before = createGameCard({
            name: 'Before',
        }, player, 'before');
        const arrowEvent = createGameCard({
            name: 'Arrow Event',
            isEvent: true,
            traits: [TRAIT_ARROW],
        }, player, 'arrow-event');
        const after = createGameCard({
            name: 'After',
        }, player, 'after');
        host.tuckedCards.push(before, arrowEvent, after);
        player.gameZone.cards.push(host);
        let hostRefreshes = 0;
        host.refresh = async () => {
            hostRefreshes++;
        };

        const effect = new PlayCardEffect({
            card: arrowEvent,
            match: {},
        });

        await effect.prepare({player});
        assert.deepEqual(host.tuckedCards, [before, after]);
        await effect.returnToSource(player);

        assert.deepEqual(host.tuckedCards, [before, arrowEvent, after]);
        assert.equal(hostRefreshes, 2);
        assert.equal(arrowEvent.isPlaying, false);
    });

    test('a successfully played tucked Event is discarded instead of returned to its host', async () => {
        const player = createPlayer();
        const discardPile = [];
        player.deck.discard = async card => {
            discardPile.push(card);
        };
        const host = createGameCard({
            name: 'Quiver',
            playTuckedCardsCondition: {
                isEvent: true,
                traits: TRAIT_ARROW,
            },
        }, player, 'quiver');
        const arrowEvent = createGameCard({
            name: 'Arrow Event',
            isEvent: true,
            traits: [TRAIT_ARROW],
        }, player, 'arrow-event');
        host.tuckedCards.push(arrowEvent);
        player.gameZone.cards.push(host);
        host.refresh = async () => {};

        const effect = new PlayCardEffect({
            ability: {
                async resolveAbility() {},
            },
            card: arrowEvent,
            match: {},
        });

        await effect.prepare({player});
        await effect.doPlay({player});

        assert.deepEqual(host.tuckedCards, []);
        assert.deepEqual(discardPile, [arrowEvent]);
        assert.equal(effect.played, true);
    });
});
