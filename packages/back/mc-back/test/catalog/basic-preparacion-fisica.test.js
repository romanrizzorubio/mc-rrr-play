import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CARD_TYPE_EVENT,
    CLASSIFICATION_BASIC,
    DIALOG_LIST,
    EFFECT_REMOVE_STATUS,
    RESOURCE_MENTAL,
    STATUS_CONFUSED,
    STATUS_STUNNED,
    TARGET_YOUR_HERO,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

describe('Preparación física', () => {
    test('is a shared Basic event and is not included in any hero configuration', async () => {
        const catalog = await loadCatalog();
        const record = catalog.aspects.find(({_id}) =>
            _id === 'basic-preparacion-fisica');

        assert.ok(record);
        assert.equal(record.classification, CLASSIFICATION_BASIC);
        assert.equal(record.card.type, CARD_TYPE_EVENT);
        assert.deepEqual(record.card.params, {
            name: 'Preparación física',
            set: CLASSIFICATION_BASIC,
            image: 'aspect/basic/events/13034.png',
            cost: 1,
            resources: [RESOURCE_MENTAL],
            classification: CLASSIFICATION_BASIC,
            abilities: [
                {
                    type: ABILITY_HERO_ACTION,
                    params: {
                        effect: {
                            type: EFFECT_REMOVE_STATUS,
                            params: {
                                target: TARGET_YOUR_HERO,
                                statuses: [STATUS_STUNNED, STATUS_CONFUSED],
                            },
                        },
                    },
                },
            ],
        });
        assert.ok(catalog.heroes.every(({config}) =>
            !JSON.stringify(config).includes(record._id)));
    });

    test('lets the Hero discard one Stunned or Confused status card', async () => {
        const catalog = await loadCatalog();
        const antMan = catalog.heroes.find(({_id}) => _id === 'ant-man');
        const record = catalog.aspects.find(({_id}) =>
            _id === 'basic-preparacion-fisica');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'basic-preparacion-fisica',
        });
        match.scenario = {
            villain: undefined,
            gameZone: {
                currentScheme: undefined,
                cards: [],
            },
        };
        const matchFactory = new MatchFactory(match);
        const {cardsFactory} = matchFactory;
        const superhero = matchFactory.createSuperhero({
            ...antMan.config,
            cards: [],
            precon: [],
        });
        superhero.selectedSide = 1;
        const player = match.createPlayer({
            name: 'Player 1',
            superhero,
            initial: true,
        });
        player.gameZone = new PlayerZone({owner: player});
        player.gameZone.refresh = async () => {};

        const event = cardsFactory.createGameCardFromConfig(record.card, {
            index: 1,
            owner: player,
        });
        const hero = superhero.currentSide;
        const ability = event.abilities[0];

        assert.equal(ability.effect.effectType, EFFECT_REMOVE_STATUS);
        assert.equal(typeof ability.effect.canRun, 'function');
        assert.deepEqual(
            await ability.effect.getValidTarget({card: event, match, player}),
            [],
        );
        superhero.selectedSide = 0;
        superhero.selectedSide = 0;
        superhero.selectedSide = 1;
        superhero.selectedSide = 1;
        hero.stunned = 1;
        hero.confused = 1;
        hero.tough = 1;
        assert.deepEqual(
            await ability.effect.getValidTarget({card: event, match, player}),
            [hero],
        );
        assert.equal(
            await ability.effect.canRun({card: event, match, player}),
            true,
        );
        assert.equal(await ability.canRun({card: event, match, player}), true);

        match.openDialog = async dialog => {
            assert.equal(dialog.dialogType, DIALOG_LIST);
            assert.deepEqual(
                dialog.data.options.map(({id}) => id),
                ['stunned', 'confused'],
            );

            return {selected: {id: STATUS_CONFUSED}};
        };
        await ability.resolveAbility({player});

        assert.equal(hero.stunned, 1);
        assert.equal(hero.confused, 0);
        assert.equal(hero.tough, 1);
    });
});
