import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_RESOURCE,
    CARD_TYPE_VILLAIN,
    DIALOG_PAY_COST,
    RESOURCE_MENTAL,
    TRAIT_AERIAL,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {Player} from '../../src/model/match/player.js';

describe('Iron Man Boots', () => {
    test('grant Aerial to Iron Man when their Hero Action resolves', async () => {
        const catalog = await loadCatalog();
        const ironMan = catalog.heroes.find(({_id}) => _id === 'ironman');
        const bootsConfig = ironMan.config.cards.find(({card}) =>
            card.params.name === 'Botas propulsoras').card;
        const updates = [];
        const match = {
            lasting: [],
            limits: {},
            mc: {
                mcSocket: {
                    send: (...args) => updates.push(args),
                },
            },
            name: 'Iron Man Boots test',
            players: [],
            triggerCards: {},
        };
        const factory = new MatchFactory(match);
        const superhero = factory.createSuperhero({
            ...ironMan.config,
            precon: [],
        });
        superhero.selectedSide = superhero.sides.findIndex(side => side.isHero);

        const player = new Player({
            match,
            name: 'Tony Stark',
            superhero,
        });
        match.players.push(player);
        player.initPlayer();

        const boots = factory.cardsFactory.createGameCardFromConfig(
            bootsConfig,
            {owner: player},
        );
        player.addToGameZone(boots);
        const resource = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name: 'Recurso mental de prueba',
                resources: [RESOURCE_MENTAL],
            },
        }, {owner: player});
        player.hand.addCard(resource);

        const ability = boots.abilities[1];
        assert.ok(ability);

        await player.resolveAbility(
            boots.id,
            1,
            undefined,
            {
                cardId: resource.id,
                resourceType: RESOURCE_MENTAL,
                source: 'hand',
            },
        );

        assert.equal(boots.exhausted, true);
        assert.ok(player.deck.discardPile.includes(resource));
        assert.ok(
            (await superhero.getEffectiveTraits({player})).includes(TRAIT_AERIAL),
        );
        assert.ok(updates.at(-1)[2].superhero.extraTraits.includes(TRAIT_AERIAL));
    });

    test('show the acquired Aerial trait and let Powered Gauntlets deal bonus damage', async () => {
        const catalog = await loadCatalog();
        const ironMan = catalog.heroes.find(({_id}) => _id === 'ironman');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'Iron Man aerial test',
        });
        match.phase = 'players';
        const factory = new MatchFactory(match);
        const superhero = factory.createSuperhero({
            ...ironMan.config,
            precon: [],
        });
        const player = match.createPlayer({
            name: 'Tony Stark',
            superhero,
            initial: true,
        });
        await player.initPlayer();
        superhero.selectedSide = superhero.sides.findIndex(side => side.isHero);
        match.currentTurnPlayer = player;

        match.scenario = {
            gameZone: {
                cards: [],
                currentScheme: undefined,
                currentVillain: undefined,
            },
        };
        const villain = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_VILLAIN,
            params: {
                name: 'Villano de prueba',
                attack: 1,
                scheme: 1,
                hitPoints: 8,
            },
        }, {owner: match.scenario});
        villain.controller = match.scenario;
        villain.refresh = async () => {};
        match.scenario.villain = villain;
        match.scenario.gameZone.currentVillain = villain;

        const bootsConfig = ironMan.config.cards.find(({card}) =>
            card.params.name === 'Botas propulsoras').card;
        const gauntletsConfig = ironMan.config.cards.find(({card}) =>
            card.params.name === 'Guanteletes potenciados').card;
        const boots = factory.cardsFactory.createGameCardFromConfig(
            bootsConfig,
            {owner: player},
        );
        const gauntlets = factory.cardsFactory.createGameCardFromConfig(
            gauntletsConfig,
            {owner: player},
        );
        boots.controller = player;
        gauntlets.controller = player;
        player.gameZone.addToGameZone(boots);
        player.gameZone.addToGameZone(gauntlets);

        const quintransporteConfig = catalog.aspects.find(({_id}) =>
            _id === 'basic-quintransporte').card;
        const quintransporte = factory.cardsFactory.createGameCardFromConfig(
            quintransporteConfig,
            {owner: player},
        );
        quintransporte.controller = player;
        player.gameZone.addToGameZone(quintransporte);
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_PAY_COST) {
                return {
                    paid: {
                        hand: [],
                        generators: [{id: quintransporte.id}],
                    },
                    resources: [RESOURCE_MENTAL],
                    fullyPaid: true,
                };
            }

            return {selected: dialog.data.cards[0]};
        };

        await player.resolveAbility(boots.id, 1);

        assert.equal(boots.abilities[1].resolved, true);
        assert.equal(boots.exhausted, true);
        assert.equal(quintransporte.exhausted, true);
        assert.equal(match.lasting.length, 1);

        const playerSnapshot = await player.toObjWithPlayableHand();
        assert.ok(playerSnapshot.superhero.extraTraits.includes(TRAIT_AERIAL));

        await player.resolveAbility(gauntlets.id, 0);

        assert.equal(villain.damage, 2);
    });
});
