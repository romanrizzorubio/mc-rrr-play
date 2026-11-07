import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ACTION,
    CARD_TYPE_ALLY,
    DIALOG_SELECT_CARD,
    DIALOG_SELECT_TARGET,
    EFFECT_SEARCH_CARDS,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {Deck} from '../../src/model/match/deck.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';
import {GetMaxAlliesEffect} from '../../src/effects/get-max-allies-effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import leadershipEvents from '../../../mc-data/seed/catalog/aspects/leadership/events.js';
import leadershipSupports from '../../../mc-data/seed/catalog/aspects/leadership/supports.js';

describe('Hacer la llamada', () => {
    test('allows cancelling the ally selection', () => {
        const makeTheCall = leadershipEvents.find(({_id}) =>
            _id === 'leadership-hacer-la-llamada');
        assert.ok(makeTheCall);

        const [{params: ability}] = makeTheCall.card.params.abilities;
        const searchEffect = ability.arrow.params.effects.find(({type}) =>
            type === EFFECT_SEARCH_CARDS);

        assert.ok(searchEffect);
        assert.equal(searchEffect.params.requireMatch, true);
        assert.equal(searchEffect.params.showCancel, true);
    });

    test('is not playable when no player has an ally in their discard pile', async () => {
        const makeTheCall = leadershipEvents.find(({_id}) =>
            _id === 'leadership-hacer-la-llamada');
        assert.ok(makeTheCall);

        const match = {
            isUniqueCard: () => false,
            triggerCards: {},
        };
        const player = {
            isPlayer: true,
            deck: {cards: [], discardPile: []},
            match,
        };
        const otherPlayer = {
            isPlayer: true,
            deck: {cards: [], discardPile: []},
            match,
        };
        match.players = [player, otherPlayer];

        const cardsFactory = new CardsFactory({match});
        const eventCard = cardsFactory.createCard({
            ...makeTheCall.card,
            params: {...makeTheCall.card.params},
        });
        const gameCard = cardsFactory.createGameCard({
            card: eventCard,
            owner: player,
        });
        const playabilityParams = {
            abilityType: ABILITY_ACTION,
            checkOnly: true,
            player,
        };

        assert.equal(await gameCard.canPlay(playabilityParams), false);

        otherPlayer.deck.discardPile.push({
            id: 'discarded-ally',
            type: CARD_TYPE_ALLY,
        });

        assert.equal(await gameCard.canPlay(playabilityParams), true);
    });

    test('opens the in-play ally discard dialog when putting a fifth ally in play with Triskelion', async () => {
        const {heroes} = await loadCatalog();
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'hacer-la-llamada-test',
        });
        const matchFactory = new MatchFactory(match);
        const player = match.createPlayer({
            name: 'Test player',
            superhero: matchFactory.createSuperhero(heroes[0].config),
            initial: true,
        });
        player.gameZone = new PlayerZone({owner: player});
        player.gameZone.refresh = async () => {};
        player.deck = new Deck({owner: player, isPlayerDeck: true});
        player.deck.cards.push({id: 'remaining-deck-card'});
        player.deck.refresh = async () => {};
        player.hand.refresh = async () => {};

        const cardsFactory = matchFactory.cardsFactory;
        const alliesInPlay = Array.from({length: 4}, (_, index) => {
            const ally = cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_ALLY,
                params: {
                    name: `Aliado en juego ${index + 1}`,
                    cost: 0,
                    attack: 1,
                    thwart: 1,
                    hitPoints: 2,
                },
            }, {index: index + 1, owner: player});
            ally.controller = player;
            player.gameZone.addToGameZone(ally);

            return ally;
        });
        const triskelionConfig = leadershipSupports.find(({_id}) =>
            _id === 'leadership-el-triskelion');
        assert.ok(triskelionConfig);
        const triskelion = cardsFactory.createGameCardFromConfig({
            ...triskelionConfig.card,
            params: {...triskelionConfig.card.params},
        }, {owner: player});
        triskelion.controller = player;
        player.gameZone.addToGameZone(triskelion);
        await triskelion.initTriggers({match, player});

        const getMaxAlliesEffect = new GetMaxAlliesEffect({match});
        await getMaxAlliesEffect.runEffect({match, player});
        assert.equal(getMaxAlliesEffect.maxAllies, 4);

        const allyFromDiscard = cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {
                name: 'Aliado del descarte',
                cost: 0,
                attack: 1,
                thwart: 1,
                hitPoints: 2,
            },
        }, {index: 5, owner: player});
        player.deck.discardPile.push(allyFromDiscard);

        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            if (dialog.dialogType === DIALOG_SELECT_CARD) {
                return {selected: [{id: allyFromDiscard.id}]};
            }
            if (dialog.dialogType === DIALOG_SELECT_TARGET) {
                return {selected: {id: alliesInPlay[0].id}};
            }

            return {};
        };

        const makeTheCall = leadershipEvents.find(({_id}) =>
            _id === 'leadership-hacer-la-llamada');
        assert.ok(makeTheCall);
        const event = cardsFactory.createGameCardFromConfig({
            ...makeTheCall.card,
            params: {...makeTheCall.card.params},
        }, {owner: player});
        const playCardEffect = new PlayCardEffect({
            ability: event.abilities[0],
            abilityType: ABILITY_ACTION,
            card: event,
            match,
        });
        player.hand.cards.push(event);

        await playCardEffect.runEffect({card: event, match, player});

        const discardDialog = dialogs.find(({dialogType}) =>
            dialogType === DIALOG_SELECT_TARGET);
        assert.ok(discardDialog);
        assert.ok(dialogs.some(({dialogType}) =>
            dialogType === DIALOG_SELECT_CARD));
        assert.equal(discardDialog.data.cards.length, 5);
        assert.ok(discardDialog.data.cards.some(({id}) =>
            id === allyFromDiscard.id));
        assert.equal(player.allies.length, 4);
        assert.ok(!player.allies.includes(alliesInPlay[0]));
        assert.ok(player.deck.discardPile.includes(alliesInPlay[0]));
        assert.ok(player.allies.includes(allyFromDiscard));
    });
});
