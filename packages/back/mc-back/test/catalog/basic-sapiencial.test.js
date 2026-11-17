import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_RESPONSE,
    CARD_TYPE_ALLY,
    CARD_TYPE_RESOURCE,
    DIALOG_USE_CARD,
    PRIORITY_RESPONSE,
    RESOURCE_MENTAL,
    TARGET_YOU,
    TRAIT_GUARDIAN,
    TRIGGER_YOU_END_PLAY_CARD,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

describe('Sapiencial', () => {
    test('offers its response after you play a Guardian ally and draws one card', async () => {
        const catalog = await loadCatalog();
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'basic-sapiencial',
        });
        match.scenario = {gameZone: {cards: []}};
        const factory = new MatchFactory(match);
        const createPlayer = (name, heroId) => {
            const hero = catalog.heroes.find(({_id}) => _id === heroId);
            const player = match.createPlayer({
                name,
                superhero: factory.createSuperhero({
                    ...hero.config,
                    cards: [],
                    precon: [],
                    obligation: undefined,
                    nemesis: [],
                }),
            });
            player.initPlayer();
            player.deck.refresh = async () => {};
            player.hand.refresh = async () => {};
            player.gameZone.refresh = async () => {};

            return player;
        };
        const player = createPlayer('Star-Lord', 'starlord');
        const otherPlayer = createPlayer('Black Widow', 'black-widow');
        player.superhero.selectedSide = 1;
        await player.superhero.initTriggers({player});
        const sapiencialEntry = catalog.aspects.find(({_id}) =>
            _id === 'basic-sapiencial');
        assert.ok(sapiencialEntry);
        assert.equal(sapiencialEntry.card.params.unique, true);
        const sapiencial = factory.cardsFactory.createGameCardFromConfig(
            sapiencialEntry.card,
            {owner: player},
        );
        sapiencial.controller = player;
        player.gameZone.addToGameZone(sapiencial);
        await sapiencial.initTriggers();

        const drawnCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name: 'Carta robada',
                resources: [RESOURCE_MENTAL],
            },
        }, {owner: player});
        player.deck.cards.push(drawnCard);

        const createPlayEffect = (owner, traits, type = CARD_TYPE_ALLY) => {
            const ally = factory.cardsFactory.createGameCardFromConfig({
                type,
                params: {
                    name: 'Aliado de prueba',
                    set: 'basic',
                    cost: 0,
                    traits,
                    hitPoints: 2,
                    attack: 1,
                    thwart: 1,
                },
            }, {owner});
            ally.controller = owner;
            const effect = new PlayCardEffect({card: ally, match});
            effect.resolved = true;
            effect.playedFromHand = true;

            return effect;
        };
        const guardianEffect = createPlayEffect(player, [TRAIT_GUARDIAN]);
        const guardianParams =
            guardianEffect.getTriggersParams({player});
        const dynamicGuardianEffect = createPlayEffect(player, []);
        player.gameZone.addToGameZone(dynamicGuardianEffect.card);
        const dynamicGuardianParams =
            dynamicGuardianEffect.getTriggersParams({player});
        assert.ok(
            (await dynamicGuardianEffect.card.getEffectiveTraits({player}))
                .includes(TRAIT_GUARDIAN),
        );
        const nonAllyEffect = createPlayEffect(player, [], CARD_TYPE_RESOURCE);
        const nonAllyParams = nonAllyEffect.getTriggersParams({player});
        const otherPlayerEffect = createPlayEffect(otherPlayer, [TRAIT_GUARDIAN]);
        const otherPlayerParams =
            otherPlayerEffect.getTriggersParams({player: otherPlayer});
        const [response] =
            sapiencial.triggers[TRIGGER_YOU_END_PLAY_CARD][PRIORITY_RESPONSE];

        assert.deepEqual(response.ability.condition, {
            'effect.card.isAlly': true,
            'effect.card.traits': TRAIT_GUARDIAN,
        });
        assert.equal(response.triggerParams, undefined);
        assert.equal(response.ability.abilityType, ABILITY_RESPONSE);
        assert.equal(response.ability.trigger, TRIGGER_YOU_END_PLAY_CARD);
        assert.equal(response.ability.effect.target, TARGET_YOU);
        assert.ok(guardianEffect.getTriggersEnds(guardianParams)
            .includes(TRIGGER_YOU_END_PLAY_CARD));
        assert.ok(
            (await guardianEffect.card.getEffectiveTraits({player}))
                .includes(TRAIT_GUARDIAN),
        );
        assert.equal(
            (await match._getTriggers(
                [TRIGGER_YOU_END_PLAY_CARD],
                PRIORITY_RESPONSE,
                guardianParams,
            )).length,
            1,
        );
        assert.equal(
            (await match._getTriggers(
                [TRIGGER_YOU_END_PLAY_CARD],
                PRIORITY_RESPONSE,
                dynamicGuardianParams,
            )).length,
            1,
        );
        assert.deepEqual(
            await match._getTriggers(
                [TRIGGER_YOU_END_PLAY_CARD],
                PRIORITY_RESPONSE,
                nonAllyParams,
            ),
            [],
        );
        assert.deepEqual(
            await match._getTriggers(
                [TRIGGER_YOU_END_PLAY_CARD],
                PRIORITY_RESPONSE,
                otherPlayerParams,
            ),
            [],
        );

        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            assert.equal(dialog.dialogType, DIALOG_USE_CARD);
            assert.equal(dialog.targetPlayer.id, player.id);

            return {selected: {id: sapiencial.id}};
        };
        await match.trigger(
            PRIORITY_RESPONSE,
            [TRIGGER_YOU_END_PLAY_CARD],
            dynamicGuardianParams,
        );

        assert.equal(dialogs.length, 1);
        assert.equal(dialogs[0].data.cards[0].id, sapiencial.id);
        assert.equal(sapiencial.exhausted, true);
        assert.deepEqual(player.hand.cards, [drawnCard]);
    });
});
