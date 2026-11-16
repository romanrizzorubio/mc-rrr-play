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
        const sapiencialEntry = catalog.aspects.find(({_id}) =>
            _id === 'basic-sapiencial');
        assert.ok(sapiencialEntry);
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

        const createPlayEffect = (owner, traits) => {
            const ally = factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_ALLY,
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
            const effect = new PlayCardEffect({card: ally, match});
            effect.resolved = true;

            return effect;
        };
        const guardianEffect = createPlayEffect(player, [TRAIT_GUARDIAN]);
        const guardianParams =
            guardianEffect.getTriggersParams({player});
        const nonGuardianEffect = createPlayEffect(player, []);
        const nonGuardianParams =
            nonGuardianEffect.getTriggersParams({player});
        const otherPlayerEffect = createPlayEffect(otherPlayer, [TRAIT_GUARDIAN]);
        const otherPlayerParams =
            otherPlayerEffect.getTriggersParams({player: otherPlayer});
        const [response] =
            sapiencial.triggers[TRIGGER_YOU_END_PLAY_CARD][PRIORITY_RESPONSE];

        assert.equal(response.ability.abilityType, ABILITY_RESPONSE);
        assert.equal(response.ability.trigger, TRIGGER_YOU_END_PLAY_CARD);
        assert.equal(response.ability.effect.target, TARGET_YOU);
        assert.ok(guardianEffect.getTriggersEnds(guardianParams)
            .includes(TRIGGER_YOU_END_PLAY_CARD));
        assert.deepEqual(
            await match._getTriggers(
                PRIORITY_RESPONSE,
                [TRIGGER_YOU_END_PLAY_CARD],
                nonGuardianParams,
            ),
            [],
        );
        assert.deepEqual(
            await match._getTriggers(
                PRIORITY_RESPONSE,
                [TRIGGER_YOU_END_PLAY_CARD],
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
            guardianParams,
        );

        assert.equal(dialogs.length, 1);
        assert.equal(dialogs[0].data.cards[0].id, sapiencial.id);
        assert.equal(sapiencial.exhausted, true);
        assert.deepEqual(player.hand.cards, [drawnCard]);
    });
});
