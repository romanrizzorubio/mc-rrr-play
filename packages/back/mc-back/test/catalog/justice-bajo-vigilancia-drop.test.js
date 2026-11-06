import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {REFRESH_EVENTS} from 'mc-endpoints';
import {
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    DIALOG_PAY_COST,
    RESOURCE_MENTAL,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {MainSchemeBCard} from '../../src/model/printed/main-scheme-b-card.js';
import {ResourceCost} from '../../src/model/costs/resource-cost.js';
import {SchemeGameCard} from '../../src/model/cards/scheme-game-card.js';

describe('Bajo vigilancia drag-and-drop', () => {
    test('preserves the dropped main scheme through payment and attaches', async () => {
        const {heroes, aspects} = await loadCatalog();
        const cardConfig = aspects.find(({_id}) =>
            _id === 'justice-bajo-vigilancia').card;
        const heroConfig = heroes.find(({_id}) =>
            _id === 'spiderwoman').config;
        const refreshPayloads = [];
        const match = new Match({
            mc: {
                mcSocket: {
                    send(_matchName, event, payload) {
                        refreshPayloads.push({event, payload});
                    },
                },
            },
            name: 'bajo-vigilancia-drag-and-drop',
        });
        const matchFactory = new MatchFactory(match);
        const printedScheme = new MainSchemeBCard({
            name: 'Plan principal de prueba',
            set: 'test',
            image: 'test.png',
            type: CARD_TYPE_MAIN_SCHEME_B_CARD,
            value: 10,
            startingThreat: 0,
        });
        printedScheme.match = match;
        const mainScheme = new SchemeGameCard({
            card: printedScheme,
            match,
        });
        mainScheme.id = 'main-scheme';
        const scenarioZone = {
            cards: [],
            mainScheme,
            async refresh() {},
        };
        mainScheme.scenarioZone = scenarioZone;
        match.scenario = {
            gameZone: scenarioZone,
            mainScheme,
        };

        const superhero = matchFactory.createSuperhero({
            ...heroConfig,
            precon: [],
        });
        const player = match.createPlayer({name: 'Spider-Woman', superhero});
        player.initPlayer();
        player.hand.refresh = async () => {};
        player.deck.refresh = async () => {};
        player.gameZone.refresh = async () => {};

        const resourceGenerator = {
            abilities: [{
                isResource: true,
                resources: [RESOURCE_MENTAL, RESOURCE_MENTAL],
            }],
            id: 'resource-generator',
            name: 'Recurso de prueba',
            owner: player,
            async resolveResourceAbility() {},
            toObj() {
                return {id: this.id, name: this.name};
            },
        };
        const getPlayerCard = player.getCard.bind(player);
        player.getCard = cardId => cardId === resourceGenerator.id ?
            resourceGenerator :
            getPlayerCard(cardId);
        player.getCardsToPay = async () => ({
            generators: [resourceGenerator],
            hand: [],
        });

        const upgrade = matchFactory.cardsFactory.createGameCardFromConfig(
            cardConfig,
            {owner: player}
        );
        upgrade.refresh = async () => {};
        player.hand.cards.push(upgrade);

        const playCardEffect = new PlayCardEffect({
            card: upgrade,
            match,
            targetId: mainScheme.id,
        });
        playCardEffect.getResourceCost = async () => new ResourceCost({
            amount: 2,
            card: upgrade,
            match,
            playCardEffect,
        });
        playCardEffect.openDialog = async ({dialogType}) => {
            assert.equal(dialogType, DIALOG_PAY_COST);

            return {
                paid: {
                    generators: [{id: resourceGenerator.id}],
                    hand: [],
                },
                resources: [RESOURCE_MENTAL, RESOURCE_MENTAL],
            };
        };

        await playCardEffect.runEffect({card: upgrade, match, player});

        assert.strictEqual(upgrade.attachedTo, mainScheme);
        assert.ok(mainScheme.attached.includes(upgrade));
        assert.equal(mainScheme.value, 14);

        const serializedScheme = mainScheme.toObj();
        assert.deepEqual(
            serializedScheme.attached.map(({id}) => id),
            [upgrade.id]
        );
        assert.equal(serializedScheme.value, 14);
        assert.ok(refreshPayloads.some(({event, payload}) =>
            event === REFRESH_EVENTS.card &&
            payload.id === mainScheme.id &&
            payload.value === 14 &&
            payload.attached.some(({id}) => id === upgrade.id)
        ));
    });
});
