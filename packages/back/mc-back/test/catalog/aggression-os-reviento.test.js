import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CALC_COUNT,
    CARD_TYPE_EVENT,
    CARD_TYPE_RESOURCE,
    CLASSIFICATION_AGGRESSION,
    EFFECT_DRAW_CARD,
    TARGET_PHASE,
    TARGET_YOU,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {DrawEffect} from '../../src/effects/draw-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

describe('¡Os reviento!', () => {
    test('is in the shared Aggression collection and absent from every precon', async () => {
        const catalog = await loadCatalog();
        const cardConfig = catalog.aspects.find(({_id}) =>
            _id === 'aggression-os-reviento');

        assert.ok(cardConfig);
        assert.equal(cardConfig.aspect, CLASSIFICATION_AGGRESSION);
        assert.equal(cardConfig.card.type, CARD_TYPE_EVENT);
        assert.equal(cardConfig.card.params.name, '¡Os reviento!');
        assert.equal(cardConfig.card.params.set, CLASSIFICATION_AGGRESSION);
        assert.equal(
            cardConfig.card.params.image,
            'aspect/aggression/events/19030.png'
        );
        assert.equal(cardConfig.card.params.cost, 0);
        assert.deepEqual(cardConfig.card.params.resources, []);
        assert.equal(
            cardConfig.card.params.classification,
            CLASSIFICATION_AGGRESSION
        );
        const [abilityConfig] = cardConfig.card.params.abilities;
        assert.equal(abilityConfig.type, ABILITY_HERO_ACTION);
        assert.deepEqual(abilityConfig.params.maximum, {
            count: 1,
            target: TARGET_PHASE,
        });
        assert.deepEqual(abilityConfig.params.effect, {
            type: EFFECT_DRAW_CARD,
            params: {
                target: TARGET_YOU,
                paramsCalc: {
                    target: 'player.minions',
                    formula: CALC_COUNT,
                },
            },
        });

        const preconIds = catalog.heroes.flatMap(({config}) =>
            config.precon.flatMap(({cardRefs = []}) =>
                cardRefs.map(({id}) => id)
            )
        );
        assert.equal(preconIds.includes(cardConfig._id), false);
    });

    test('draws one card per minion engaged with the acting player', async () => {
        const catalog = await loadCatalog();
        const cardConfig = catalog.aspects.find(({_id}) =>
            _id === 'aggression-os-reviento');
        const heroConfig = catalog.heroes.find(({_id}) => _id === 'ant-man');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'aggression-os-reviento',
        });
        const matchFactory = new MatchFactory(match);
        const createPlayer = name => {
            const superhero = matchFactory.createSuperhero({
                ...heroConfig.config,
                cards: [],
                precon: [],
            });
            superhero.selectedSide = 1;
            const player = match.createPlayer({name, superhero});
            player.initPlayer();

            return player;
        };
        const player = createPlayer('Player 1');
        const otherPlayer = createPlayer('Player 2');
        match.scenario = {gameZone: {cards: []}};

        player.gameZone.engage({id: 'engaged-minion-1', isMinion: true});
        player.gameZone.engage({id: 'engaged-minion-2', isMinion: true});
        otherPlayer.gameZone.engage({
            id: 'other-player-minion',
            isMinion: true,
        });

        const drawnCards = Array.from({length: 3}, (_, index) =>
            matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_RESOURCE,
                params: {name: `Carta robada ${index + 1}`, resources: []},
            }, {owner: player})
        );
        player.deck.cards.push(...drawnCards);

        const event = matchFactory.cardsFactory.createGameCardFromConfig(
            cardConfig.card,
            {index: 1, owner: player}
        );
        const [ability] = event.abilities;

        assert.ok(ability.effect instanceof DrawEffect);
        assert.equal(ability.effect.effectType, EFFECT_DRAW_CARD);
        assert.equal(ability.effect.target, TARGET_YOU);
        assert.equal(typeof ability.effect.canRun, 'function');

        await ability.resolveAbility({card: event, match, player});

        assert.deepEqual(player.hand.cards, drawnCards.slice(0, 2));
        assert.deepEqual(player.deck.cards, drawnCards.slice(2));

        const secondCopy = matchFactory.cardsFactory.createGameCardFromConfig(
            cardConfig.card,
            {index: 2, owner: otherPlayer}
        );
        const [secondAbility] = secondCopy.abilities;
        assert.equal(secondAbility.maximum.canUse(), false);
    });
});
