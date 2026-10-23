import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ACTION,
    ABILITY_CONSTANT,
    CARD_TYPE_ALLY,
    CARD_TYPE_UPGRADE,
    EFFECT_EXHAUST,
    EFFECT_MODIFY_TRAITS,
    EFFECT_READY,
    RESOURCE_ENERGY,
    TARGET_ALLY,
    TARGET_ATTACHED,
    TARGET_EFFECT,
    TARGET_THIS,
    TRAIT_AERIAL,
    TRAIT_AVENGER,
    TRAIT_VEHICLE,
    TRIGGER_ATTACHED_GET_TRAITS,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';

describe('Aeromoto', () => {
    test('defines the Leadership upgrade and includes the configured copies in the Hawkeye precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const aeromoto = aspects.find(({_id}) => _id === 'leadership-aeromoto');
        const hawkeye = heroes.find(({_id}) => _id === 'hawkeye');

        assert.ok(aeromoto);
        assert.ok(hawkeye);
        assert.equal(aeromoto.aspect, 'leadership');
        assert.equal(aeromoto.card.type, CARD_TYPE_UPGRADE);
        assert.equal(aeromoto.card.params.name, 'Aeromoto');
        assert.equal(
            aeromoto.card.params.image,
            'aspect/leadership/upgrades/04015.png',
        );
        assert.deepEqual(aeromoto.card.params.traits, [TRAIT_VEHICLE]);
        assert.equal(aeromoto.card.params.cost, 1);
        assert.deepEqual(aeromoto.card.params.resources, [RESOURCE_ENERGY]);
        assert.deepEqual(aeromoto.card.params.attach, {
            target: TARGET_ALLY,
            condition: {traits: TRAIT_AVENGER},
        });
        assert.equal(aeromoto.card.params.maxAttach, 1);

        const [grantAerial, readyAlly] = aeromoto.card.params.abilities;
        assert.equal(grantAerial.type, ABILITY_CONSTANT);
        assert.equal(grantAerial.params.trigger, TRIGGER_ATTACHED_GET_TRAITS);
        assert.deepEqual(grantAerial.params.effect, {
            type: EFFECT_MODIFY_TRAITS,
            params: {target: TARGET_EFFECT, traits: [TRAIT_AERIAL]},
        });
        assert.equal(readyAlly.type, ABILITY_ACTION);
        assert.equal(readyAlly.params.arrow.type, EFFECT_EXHAUST);
        assert.deepEqual(readyAlly.params.arrow.params, {target: TARGET_THIS});
        assert.equal(readyAlly.params.effect.type, EFFECT_READY);
        assert.deepEqual(readyAlly.params.effect.params, {target: TARGET_ATTACHED});

        const reference = hawkeye.config.precon
            .find(({aspect}) => aspect === 'leadership')
            .cardRefs.find(({id}) => id === aeromoto._id);
        assert.deepEqual(reference, {id: aeromoto._id, count: 3});
    });

    test('limits attachment to Avengers, grants Aerial, and readies its attached ally', async () => {
        const {aspects} = await loadCatalog();
        const aeromotoConfig = aspects.find(({_id}) => _id === 'leadership-aeromoto');
        assert.ok(aeromotoConfig);

        const match = {
            mc: {mcSocket: {send() {}}},
            players: [],
            triggerCards: {},
            lasting: [],
            limits: {},
        };
        const factory = new MatchFactory(match);
        const player = {
            isPlayer: true,
            name: 'Test player',
            allies: [],
            gameZone: {
                cards: [],
                async refresh() {},
            },
        };
        match.players.push(player);

        const createAlly = (name, traits) => {
            const ally = factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_ALLY,
                params: {
                    name,
                    traits,
                    hitPoints: 3,
                    attack: 1,
                    thwart: 1,
                },
            }, {owner: player});
            ally.controller = player;
            ally.refresh = async () => {};
            player.allies.push(ally);

            return ally;
        };

        const avenger = createAlly('Aliado Vengador', [TRAIT_AVENGER]);
        const nonAvenger = createAlly('Aliado sin rasgo Vengador', []);
        const aeromoto = factory.cardsFactory.createGameCardFromConfig(
            aeromotoConfig.card,
            {owner: player},
        );
        aeromoto.controller = player;
        aeromoto.refresh = async () => {};
        for (const ability of aeromoto.abilities) {
            assert.equal(Array.isArray(ability.effect), false);
            assert.equal(typeof ability.effect.canRun, 'function');
        }

        const attachEffect = aeromoto.card.createAttachEffect(aeromoto);
        const validTargets = await attachEffect.getValidTarget({match, player});
        assert.deepEqual(validTargets.map(({name}) => name), ['Aliado Vengador']);

        const playEffect = new PlayCardEffect({
            card: aeromoto,
            match,
            targetId: avenger.id,
        });
        assert.equal(playEffect.target, TARGET_ALLY);
        assert.deepEqual(
            await playEffect.getValidTarget({match, player}),
            [avenger],
        );
        await playEffect.preselectDroppedTarget({match, player});
        assert.equal(playEffect.selectedTarget, avenger);

        attachEffect.selectedTarget = avenger;
        await attachEffect.execute({});
        await aeromoto.initTriggers();
        assert.deepEqual(await avenger.getEffectiveTraits({player}), [
            TRAIT_AVENGER,
            TRAIT_AERIAL,
        ]);
        assert.deepEqual(await nonAvenger.getEffectiveTraits({player}), []);

        const duplicate = factory.cardsFactory.createGameCardFromConfig(
            aeromotoConfig.card,
            {owner: player},
        );
        const duplicatePlayEffect = new PlayCardEffect({card: duplicate, match});
        assert.deepEqual(
            await duplicatePlayEffect.getValidTarget({match, player}),
            [],
        );

        avenger.exhausted = true;
        const action = aeromoto.abilities.find(({effect}) =>
            effect?.effectType === EFFECT_READY);
        assert.ok(action);
        assert.equal(typeof action.effect.canRun, 'function');
        await action.resolveAbility({match, player, card: aeromoto});

        assert.equal(aeromoto.exhausted, true);
        assert.equal(avenger.exhausted, false);

        aeromoto.endTriggers();
        assert.deepEqual(await avenger.getEffectiveTraits({player}), [TRAIT_AVENGER]);
        assert.deepEqual(avenger.extraTraits, []);
    });
});
