import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CARD_TYPE_ALLY,
    CARD_TYPE_EVENT,
    EFFECT_TOUGH,
    RESOURCE_MENTAL,
    TARGET_ALLY_YOU_CONTROL,
    TRAIT_TACTIC,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';
import {ToughEffect} from '../../src/effects/tough-effect.js';

describe('Listo para la acción', () => {
    test('defines the Leadership event and includes three copies in the Hawkeye precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const readyForAction = aspects.find(({_id}) =>
            _id === 'leadership-listo-para-la-accion');
        const hawkeye = heroes.find(({_id}) => _id === 'hawkeye');

        assert.ok(readyForAction);
        assert.ok(hawkeye);
        assert.equal(readyForAction.aspect, 'leadership');
        assert.equal(readyForAction.card.type, CARD_TYPE_EVENT);
        assert.equal(readyForAction.card.params.name, 'Listo para la acción');
        assert.equal(
            readyForAction.card.params.image,
            'aspect/leadership/events/04017.png',
        );
        assert.deepEqual(readyForAction.card.params.traits, [TRAIT_TACTIC]);
        assert.equal(readyForAction.card.params.cost, 1);
        assert.deepEqual(
            readyForAction.card.params.resources,
            [RESOURCE_MENTAL],
        );

        const [ability] = readyForAction.card.params.abilities;
        assert.equal(ability.type, ABILITY_HERO_ACTION);
        assert.deepEqual(ability.params.effect, {
            type: EFFECT_TOUGH,
            params: {target: TARGET_ALLY_YOU_CONTROL},
        });

        const reference = hawkeye.config.precon
            .find(({aspect}) => aspect === 'leadership')
            .cardRefs.find(({id}) => id === readyForAction._id);
        assert.deepEqual(reference, {
            id: readyForAction._id,
            count: 3,
        });
    });

    test('gives a Tough status card to an ally the player controls', async () => {
        const {aspects, heroes} = await loadCatalog();
        const readyForAction = aspects.find(({_id}) =>
            _id === 'leadership-listo-para-la-accion');
        const hawkeye = heroes.find(({_id}) => _id === 'hawkeye');
        assert.ok(readyForAction);
        assert.ok(hawkeye);

        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'leadership-listo-para-la-accion',
        });
        match.scenario = {
            villain: undefined,
            gameZone: {
                currentScheme: undefined,
                cards: [],
            },
        };
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero(hawkeye.config);
        superhero.selectedSide = 1;
        const player = match.createPlayer({
            name: 'Hawkeye',
            superhero,
            initial: true,
        });
        player.gameZone = new PlayerZone({owner: player});
        player.gameZone.refresh = async () => {};
        player.hand.refresh = async () => {};

        const event = matchFactory.cardsFactory.createGameCardFromConfig(
            readyForAction.card,
            {owner: player},
        );
        const ally = matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {
                name: 'Aliado de prueba',
                hitPoints: 2,
                attack: 1,
                thwart: 1,
            },
        }, {index: 1, owner: player});
        event.refresh = async () => {};
        ally.controller = player;
        ally.refresh = async () => {};
        player.gameZone.addToGameZone(ally);

        const [ability] = event.abilities;
        assert.ok(ability.effect instanceof ToughEffect);
        assert.equal(typeof ability.effect.canRun, 'function');
        assert.deepEqual(
            await ability.effect.getValidTarget({match, player}),
            [ally],
        );

        await ability.resolveAbility({match, player, card: event});

        assert.equal(ally.isTough, true);
    });
});
