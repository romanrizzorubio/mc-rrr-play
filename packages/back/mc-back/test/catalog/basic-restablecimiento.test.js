import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ALTEREGO_ACTION,
    ABILITY_CONSTANT,
    CALC_RECOVERY,
    CARD_TYPE_EVENT,
    CLASSIFICATION_BASIC,
    EFFECT_HEAL,
    EFFECT_MODIFY_RECOVERY_VALUE,
    RESOURCE_PHYSICAL,
    TARGET_ALTEREGO,
    TARGET_EFFECT,
    TRIGGER_YOUR_ALTEREGO_GET_RECOVERY,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

describe('Restablecimiento', () => {
    test('is a shared Basic event and is not included in any hero precon', async () => {
        const catalog = await loadCatalog();
        const record = catalog.aspects.find(({_id}) =>
            _id === 'basic-restablecimiento');

        assert.ok(record);
        assert.equal(record.classification, CLASSIFICATION_BASIC);
        assert.equal(record.card.type, CARD_TYPE_EVENT);
        assert.deepEqual(record.card.params, {
            name: 'Restablecimiento',
            set: CLASSIFICATION_BASIC,
            image: 'aspect/basic/events/15031.png',
            cost: 2,
            resources: [RESOURCE_PHYSICAL],
            classification: CLASSIFICATION_BASIC,
            abilities: [
                {
                    type: ABILITY_ALTEREGO_ACTION,
                    params: {
                        effect: {
                            type: EFFECT_HEAL,
                            params: {
                                target: TARGET_ALTEREGO,
                                paramsCalc: {
                                    target: 'player.superhero',
                                    formula: CALC_RECOVERY,
                                },
                            },
                        },
                    },
                },
            ],
        });
        assert.ok(catalog.heroes.every(({config}) =>
            !(config.precon || []).some(({cardRefs = []}) =>
                cardRefs.some(({id}) => id === record._id))));
    });

    test('heals the Alter Ego by its modified REC and is unavailable in Hero form', async () => {
        const catalog = await loadCatalog();
        const scarletWitch = catalog.heroes.find(({_id}) =>
            _id === 'scarlet-witch');
        const record = catalog.aspects.find(({_id}) =>
            _id === 'basic-restablecimiento');
        const recoveryModifier = {
            type: ABILITY_CONSTANT,
            params: {
                trigger: TRIGGER_YOUR_ALTEREGO_GET_RECOVERY,
                effect: {
                    type: EFFECT_MODIFY_RECOVERY_VALUE,
                    params: {
                        target: TARGET_EFFECT,
                        count: 2,
                    },
                },
            },
        };
        const heroConfig = {
            ...scarletWitch.config,
            sides: scarletWitch.config.sides.map((side, index) =>
                index === 0 ?
                    {
                        ...side,
                        params: {
                            ...side.params,
                            abilities: [
                                ...side.params.abilities,
                                recoveryModifier,
                            ],
                        },
                    } :
                    side),
        };
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'basic-restablecimiento',
        });
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...heroConfig,
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
        player.placeDamage(7);

        const event = matchFactory.cardsFactory.createGameCardFromConfig(
            record.card,
            {index: 1, owner: player},
        );
        const [ability] = event.abilities;
        const abilityContext = {card: event, match, player};

        assert.equal(await ability.canRun(abilityContext), false);

        superhero.selectedSide = 0;
        await superhero.initTriggers();

        assert.equal(ability.effect.effectType, EFFECT_HEAL);
        assert.equal(typeof ability.effect.canRun, 'function');
        assert.equal(await ability.canRun(abilityContext), true);

        await ability.resolveAbility(abilityContext);

        assert.equal(player.damage, 2);
    });
});
