import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ACTION,
    CARD_TYPE_EVENT,
    CLASSIFICATION_BASIC,
    EFFECT_LASTING,
    EFFECT_MODIFY_HAND_SIZE,
    PRIORITY_CONSTANT,
    RESOURCE_MENTAL,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_YOUR_SUPERHERO,
    TIME_PHASE,
    TRAIT_TACTIC,
    TRIGGER_GET_HAND_SIZE,
    TRIGGER_PHASE_ENDS,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {Player} from '../../src/model/match/player.js';

describe('Evaluar la situación', () => {
    test('is a shared Basic event and is not included in any hero configuration', async () => {
        const catalog = await loadCatalog();
        const record = catalog.aspects.find(({_id}) =>
            _id === 'basic-evaluar-la-situacion');

        assert.ok(record);
        assert.equal(record.classification, CLASSIFICATION_BASIC);
        assert.equal(record.card.type, CARD_TYPE_EVENT);
        assert.deepEqual(record.card.params.traits, [TRAIT_TACTIC]);
        assert.equal(record.card.params.cost, 0);
        assert.deepEqual(record.card.params.resources, [RESOURCE_MENTAL]);
        assert.equal(record.card.params.image, 'aspect/basic/events/12033.png');
        assert.deepEqual(record.card.params.abilities, [
            {
                type: ABILITY_ACTION,
                params: {
                    effect: {
                        type: EFFECT_LASTING,
                        params: {
                            until: TIME_PHASE,
                            triggerType: TRIGGER_GET_HAND_SIZE,
                            triggerParams: {
                                target: TARGET_CARD,
                            },
                            triggerTarget: TARGET_YOUR_SUPERHERO,
                            effect: {
                                type: EFFECT_MODIFY_HAND_SIZE,
                                params: {
                                    target: TARGET_EFFECT,
                                    count: 1,
                                },
                            },
                        },
                    },
                },
            },
        ]);
        assert.ok(catalog.heroes.every(({config}) =>
            !JSON.stringify(config).includes(record._id)));
    });

    test("increases only its player's hand size until the phase ends", async () => {
        const catalog = await loadCatalog();
        const antMan = catalog.heroes.find(({_id}) => _id === 'ant-man');
        const record = catalog.aspects.find(({_id}) =>
            _id === 'basic-evaluar-la-situacion');
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

        const createSuperhero = index => {
            const sides = cardsFactory.createSides(antMan.config.sides, index);
            return cardsFactory.createCardSides(sides, index);
        };
        const player = new Player({
            name: 'Player 1',
            superhero: createSuperhero(1),
        });
        const otherPlayer = new Player({
            name: 'Player 2',
            superhero: createSuperhero(2),
        });
        match.players = [player, otherPlayer];

        const event = cardsFactory.createGameCardFromConfig(record.card, {
            index: 3,
            owner: player,
        });
        const playerHandSize = await player.getHandSize();
        const otherPlayerHandSize = await otherPlayer.getHandSize();
        await event.abilities[0].resolveAbility({player});

        assert.equal(event.abilities[0].effect.effectType, EFFECT_LASTING);
        assert.equal(
            event.abilities[0].effect.effect.effectType,
            EFFECT_MODIFY_HAND_SIZE,
        );
        assert.equal(typeof event.abilities[0].effect.canRun, 'function');

        assert.equal(await player.getHandSize(), playerHandSize + 1);
        assert.equal(await otherPlayer.getHandSize(), otherPlayerHandSize);

        await player.superhero.trigger(
            PRIORITY_CONSTANT,
            [TRIGGER_PHASE_ENDS],
            {match, player},
        );

        assert.equal(match.lasting.length, 0);
        assert.equal(await player.getHandSize(), playerHandSize);
        assert.equal(await otherPlayer.getHandSize(), otherPlayerHandSize);
    });
});
