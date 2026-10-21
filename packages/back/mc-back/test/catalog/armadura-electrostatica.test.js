import assert from 'node:assert/strict';
import {describe, it} from 'node:test';

import {
    ABILITY_RESPONSE,
    CARD_TYPE_UPGRADE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_TAKE_DAMAGE,
    PRIORITY_RESPONSE,
    RESOURCE_ENERGY,
    TARGET_ANY_PLAYER,
    TARGET_ATTACKER,
    TARGET_PLAYER,
    TRAIT_ARMOR,
    TRAIT_TECH,
    TRIGGER_ENEMY_ATTACKS_YOU,
} from 'mc-shared';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {Engine} from '../../src/engine/engine.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import protectionUpgrades from '../../../mc-data/seed/catalog/aspects/protection/upgrades.js';

describe('Armadura electrostática', () => {
    const catalogEntry = protectionUpgrades.find(({_id}) =>
        _id === 'protection-armadura-electrostatica');

    it('se registra como mejora compartida de Protección', () => {
        assert.ok(catalogEntry);

        const {type, params} = catalogEntry.card;
        assert.equal(type, CARD_TYPE_UPGRADE);
        assert.equal(params.name, 'Armadura electrostática');
        assert.equal(params.image, 'aspect/protection/upgrades/10031.png');
        assert.deepEqual(params.traits, [TRAIT_ARMOR, TRAIT_TECH]);
        assert.equal(params.cost, 1);
        assert.deepEqual(params.resources, [RESOURCE_ENERGY]);
        assert.equal(params.controllerTarget, TARGET_ANY_PLAYER);
        assert.deepEqual(params.maximum, {
            count: 1,
            target: TARGET_PLAYER,
        });

        const [ability] = params.abilities;
        assert.equal(ability.type, ABILITY_RESPONSE);
        assert.equal(ability.params.trigger, TRIGGER_ENEMY_ATTACKS_YOU);
        assert.deepEqual(ability.params.condition, {
            'effect.isDefended': true,
        });
        assert.equal(ability.params.effect.type, EFFECT_DEAL_DAMAGE);
        assert.deepEqual(ability.params.effect.params, {
            target: TARGET_ATTACKER,
            damage: 1,
        });
    });

    it('solo responde al final de un ataque defendido', async () => {
        assert.ok(catalogEntry);

        const match = {triggerCards: {}};
        const player = {isPlayer: true};
        const attacker = {
            isInPlay: true,
            isMinion: true,
            name: 'Atacante',
        };
        const cardsFactory = new CardsFactory({match});
        const card = cardsFactory.createGameCardFromConfig(
            catalogEntry.card,
            {owner: player},
        );
        card.controller = player;
        await card.initTriggers();
        assert.equal(
            typeof card.abilities[0].effect.canRun,
            'function',
        );

        const engine = new Engine();
        engine.match = match;

        const createAttack = ({defended}) => {
            const attack = new EnemyAttackEffect({
                activation: {getTriggersEnds: () => []},
                enemy: attacker,
                match,
                selectedTarget: player,
            });
            if (defended) {
                attack.defender = {isHero: true, owner: player};
            }
            return attack;
        };
        const findAvailableResponses = async attack => {
            const params = {attack, effect: attack, match, player};
            return engine._getTriggers(
                attack.getTriggersEnds(params),
                PRIORITY_RESPONSE,
                params,
            );
        };
        const defendedAttack = createAttack({defended: true});
        const undefendedAttack = createAttack({defended: false});

        assert.deepEqual(
            (await findAvailableResponses(defendedAttack))
                .map(trigger => trigger.card),
            [card],
        );
        assert.deepEqual(
            await findAvailableResponses(undefendedAttack),
            [],
        );

        const damageRequests = [];
        match.effectsFactory = {
            createEffect: params => ({
                runEffect: async () => damageRequests.push(params),
            }),
        };
        const effectParams = {
            attack: defendedAttack,
            effect: defendedAttack,
            match,
            player,
        };
        const responseEffect = card.abilities[0].effect;
        await responseEffect.prepare(effectParams);
        await responseEffect.execute(effectParams);

        assert.deepEqual(damageRequests.map(({type, selectedTarget, damage}) => ({
            type,
            selectedTarget,
            damage,
        })), [{
            type: EFFECT_TAKE_DAMAGE,
            selectedTarget: attacker,
            damage: 1,
        }]);
    });
});
