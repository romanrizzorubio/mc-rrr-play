import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_RESPONSE,
    CARD_TYPE_EVENT,
    CLASSIFICATION_LEADERSHIP,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_DEFENSE_VALUE,
    EFFECT_MODIFY_THWART_VALUE,
    RESOURCE_MENTAL,
    TARGET_YOUR_HERO,
    TIME_ROUND,
    TRIGGER_YOUR_SUPERHERO_FLIPS,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {HeroResponseAbility} from '../../src/abilities/response/hero-response-ability.js';
import {LastingEffect} from '../../src/effects/lasting-effect.js';
import {ModifyAttackValueEffect} from '../../src/effects/modify-attack-value-effect.js';
import {ModifyDefenseValueEffect} from '../../src/effects/modify-defense-value-effect.js';
import {ModifyThwartValueEffect} from '../../src/effects/modify-thwart-value-effect.js';
import {SimultaneousEffect} from '../../src/effects/simultaneous-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {Hand} from '../../src/model/match/hand.js';

describe('Aplomo', () => {
    const createContext = async () => {
        const {aspects, heroes} = await loadCatalog();
        const definition = aspects.find(({_id}) => _id === 'leadership-aplomo');
        const antMan = heroes.find(({_id}) => _id === 'ant-man');
        const match = {
            currentRound: 1,
            inPlayCards: [],
            lasting: [],
            limits: {},
            players: [],
            scenario: {},
            triggerCards: {},
        };
        const cardsFactory = new CardsFactory({match});
        match.effectsFactory = cardsFactory.abilitiesFactory.effectsFactory;
        const superhero = cardsFactory.createCardSides(
            cardsFactory.createSides(antMan.config.sides)
        );
        const player = {
            isPlayer: true,
            match,
            superhero,
            get isHero() {
                return superhero.isHero;
            },
        };
        superhero.owner = player;
        player.hand = new Hand(player);
        player.hand.refresh = async () => {};
        superhero.refresh = async () => {};
        const event = cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player},
        );
        player.hand.addCard(event);

        return {antMan, definition, event, match, player, superhero};
    };

    test('registers three copies in the Ant-Man precon with its printed cost and resource', async () => {
        const {antMan, definition, event} = await createContext();

        assert.ok(antMan);
        assert.ok(definition);
        assert.equal(definition.aspect, CLASSIFICATION_LEADERSHIP);
        assert.deepEqual(
            antMan.config.precon
                .find(({aspect}) => aspect === CLASSIFICATION_LEADERSHIP)
                .cardRefs.find(({id}) => id === definition._id),
            {id: definition._id, count: 3},
        );
        assert.equal(definition.card.type, CARD_TYPE_EVENT);
        assert.equal(definition.card.params.name, 'Aplomo');
        assert.equal(
            definition.card.params.image,
            'aspect/leadership/events/12016.png',
        );
        assert.equal(definition.card.params.cost, 0);
        assert.deepEqual(definition.card.params.resources, [RESOURCE_MENTAL]);

        const [ability] = event.abilities;
        assert.ok(ability instanceof HeroResponseAbility);
        assert.equal(definition.card.params.abilities[0].type, ABILITY_HERO_RESPONSE);
        assert.equal(ability.trigger, TRIGGER_YOUR_SUPERHERO_FLIPS);
        assert.ok(ability.effect instanceof LastingEffect);
        assert.ok(ability.effect.effect instanceof SimultaneousEffect);
        assert.deepEqual(
            ability.effect.effect.effects.map(({effectType}) => effectType),
            [
                EFFECT_MODIFY_THWART_VALUE,
                EFFECT_MODIFY_ATTACK_VALUE,
                EFFECT_MODIFY_DEFENSE_VALUE,
            ],
        );
        assert.ok(
            ability.effect.effect.effects[0] instanceof ModifyThwartValueEffect,
        );
        assert.ok(
            ability.effect.effect.effects[1] instanceof ModifyAttackValueEffect,
        );
        assert.ok(
            ability.effect.effect.effects[2] instanceof ModifyDefenseValueEffect,
        );
        assert.equal(ability.effect.target, TARGET_YOUR_HERO);
        assert.equal(ability.effect.until, TIME_ROUND);
        assert.equal(typeof ability.effect.canRun, 'function');
        assert.equal(typeof ability.effect.effect.canRun, 'function');
    });

    test('grants the Hero +1 INT, ATQ, and DEF after a flip until the round ends', async () => {
        const {event, match, player, superhero} = await createContext();
        const [ability] = event.abilities;

        assert.equal(await ability.canRun({
            card: event,
            match,
            player,
            triggeredCard: superhero,
        }), false);

        superhero.selectedSide = 1;
        const hero = superhero.currentSide;
        hero.refresh = async () => {};
        const triggerParams = {
            ability,
            card: event,
            match,
            player,
            triggeredCard: superhero,
        };

        assert.equal(await ability.canRun(triggerParams), true);
        assert.equal(await hero.getThwartValue({player}), 2);
        assert.equal(await hero.getAttackValue({player}), 1);
        assert.equal(await hero.getDefenseValue({player}), 2);

        await ability.effect.runEffect(triggerParams);

        assert.equal(await hero.getThwartValue({player}), 3);
        assert.equal(await hero.getAttackValue({player}), 2);
        assert.equal(await hero.getDefenseValue({player}), 3);
        const [lasting] = match.lasting;
        assert.equal(lasting.until, TIME_ROUND);
        assert.equal(lasting.cleanups.length, 3);
        for (const cleanup of lasting.cleanups) {
            await cleanup.runEffect({player, lasting});
        }
        assert.equal(await hero.getThwartValue({player}), 2);
        assert.equal(await hero.getAttackValue({player}), 1);
        assert.equal(await hero.getDefenseValue({player}), 2);
    });
});
