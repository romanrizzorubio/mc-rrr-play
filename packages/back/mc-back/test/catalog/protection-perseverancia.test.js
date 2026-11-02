import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_RESPONSE,
    CARD_TYPE_EVENT,
    CLASSIFICATION_PROTECTION,
    EFFECT_TOUGH,
    RESOURCE_MENTAL,
    TARGET_YOUR_HERO,
    TRAIT_TACTIC,
    TRIGGER_YOUR_SUPERHERO_FLIPS,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {HeroResponseAbility} from '../../src/abilities/response/hero-response-ability.js';
import {ToughEffect} from '../../src/effects/tough-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

describe('Perseverancia', () => {
    const createContext = async () => {
        const {aspects, heroes} = await loadCatalog();
        const definition = aspects.find(({_id}) =>
            _id === 'protection-perseverancia');
        const antMan = heroes.find(({_id}) => _id === 'ant-man');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'protection-perseverancia',
        });
        match.scenario = {
            villain: undefined,
            gameZone: {
                currentScheme: undefined,
                cards: [],
            },
        };
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero(antMan.config);
        const player = match.createPlayer({
            name: 'Ant-Man',
            superhero,
            initial: true,
        });
        player.gameZone = new PlayerZone({owner: player});
        player.gameZone.refresh = async () => {};
        player.hand.refresh = async () => {};
        superhero.refresh = async () => {};
        const event = matchFactory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player},
        );
        event.refresh = async () => {};
        player.hand.addCard(event);

        return {definition, event, heroes, match, player, superhero};
    };

    test('defines a shared Protection event without adding it to a precon', async () => {
        const {definition, heroes} = await createContext();

        assert.ok(definition);
        assert.equal(definition.aspect, CLASSIFICATION_PROTECTION);
        assert.equal(definition.card.type, CARD_TYPE_EVENT);
        assert.equal(definition.card.params.name, 'Perseverancia');
        assert.equal(
            definition.card.params.image,
            'aspect/protection/events/13033.png',
        );
        assert.deepEqual(definition.card.params.traits, [TRAIT_TACTIC]);
        assert.equal(definition.card.params.cost, 1);
        assert.deepEqual(
            definition.card.params.resources,
            [RESOURCE_MENTAL],
        );

        const [ability] = definition.card.params.abilities;
        assert.equal(ability.type, ABILITY_HERO_RESPONSE);
        assert.deepEqual(ability.params, {
            trigger: TRIGGER_YOUR_SUPERHERO_FLIPS,
            effect: {
                type: EFFECT_TOUGH,
                params: {target: TARGET_YOUR_HERO},
            },
        });
        assert.equal(
            heroes.some(({config}) =>
                config.precon?.some(({cardRefs}) =>
                    cardRefs.some(({id}) => id === definition._id),
                ),
            ),
            false,
        );
    });

    test('gives your Hero Tough after changing to Hero identity', async () => {
        const {event, match, player, superhero} = await createContext();
        const [ability] = event.abilities;
        const triggerParams = {
            ability,
            card: event,
            match,
            player,
            triggeredCard: superhero,
        };

        assert.ok(ability instanceof HeroResponseAbility);
        assert.equal(ability.trigger, TRIGGER_YOUR_SUPERHERO_FLIPS);
        assert.ok(ability.effect instanceof ToughEffect);
        assert.equal(ability.effect.target, TARGET_YOUR_HERO);
        assert.equal(typeof ability.effect.canRun, 'function');

        superhero.selectedSide = 0;
        assert.equal(await ability.canRun(triggerParams), false);

        superhero.selectedSide = 1;
        const hero = superhero.currentSide;
        hero.refresh = async () => {};
        assert.equal(await ability.canRun(triggerParams), true);

        await ability.resolveAbility(triggerParams);

        assert.equal(hero.isTough, true);
    });
});
