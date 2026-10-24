import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {AbilitiesFactory} from '../../src/factory/abilities/abilities-factory.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {EnemyAttacksYouTrigger} from '../../src/triggers/enemy-attacks-you-trigger.js';
import captainAmerica from '../../../mc-data/seed/catalog/heroes/captain-america.js';
import protectionUpgrades from '../../../mc-data/seed/catalog/aspects/protection/upgrades.js';

function createPlayer(id) {
    const player = {
        canAttack: () => true,
        canDefend: () => true,
        id,
        isHero: true,
        isPlayer: true,
    };
    const hero = {
        exhausted: false,
        id: `${id}-hero`,
        isHero: true,
        isSuperhero: false,
        name: `${id} Hero`,
        owner: player,
    };

    player.superhero = {
        currentSide: hero,
        isSuperhero: true,
        owner: player,
    };

    return player;
}

function createAttack(match, target) {
    const attack = new EnemyAttackEffect({
        enemy: {isVillain: false, name: 'Minion'},
        match,
        selectedTarget: target,
    });
    attack.activation = {effect: attack, takenDamage: 0};
    attack.trigger = async () => true;

    return attack;
}

describe('defense abilities during damage resolution', () => {
    test('Bloqueo de escudo makes the hero the defender and enables Imperturbable', async () => {
        const match = {triggerCards: {}};
        const player = createPlayer('player');
        const attack = createAttack(match, player);
        const damageEffect = new TakeDamageEffect({
            activation: attack.activation,
            damage: 3,
            isAttack: true,
            match,
            selectedTarget: player.superhero.currentSide,
        });
        damageEffect.preventDamage = 3;

        const abilityFactory = new AbilitiesFactory({match});
        const shieldBlockConfig = captainAmerica.config.cards.find(({card}) =>
            card.params.name === 'Bloqueo de escudo').card.params.abilities[0];
        const shieldBlock = abilityFactory.createAbility(shieldBlockConfig);
        shieldBlock.card = {
            id: 'shield-block',
            isEvent: true,
            owner: player,
        };
        const resolutionEffect = shieldBlock.effect.createInstance({
            ability: shieldBlock,
        });
        resolutionEffect.canRun = async () => true;
        resolutionEffect.runEffect = async () => {
            resolutionEffect.resolved = true;
        };

        assert.equal(shieldBlock.isDefense, true);
        assert.equal(damageEffect.activation.effect, attack);
        assert.equal(damageEffect.takenDamage, 0);

        await shieldBlock.resolveAbility({
            arrowPaid: true,
            effect: damageEffect,
            prePlayConfirmationAcceptedFor: resolutionEffect,
            player,
            triggeredEffect: damageEffect,
        }, resolutionEffect);

        assert.equal(attack.isDefended, true);
        assert.equal(attack.defender, player.superhero.currentSide);
        attack.activation.takenDamage = damageEffect.takenDamage;

        const imperturbableConfig = protectionUpgrades.find(({_id}) =>
            _id === 'protection-imperturbable').card.params.abilities[0];
        const imperturbable = abilityFactory.createAbility(imperturbableConfig);
        imperturbable.card = {
            id: 'imperturbable',
            isUpgrade: true,
            owner: player,
            controller: player,
        };
        imperturbable.effect.canRun = async () => true;
        imperturbable.costs.canPay = async () => true;
        const imperturbableTrigger = new EnemyAttacksYouTrigger({
            ability: imperturbable,
            card: imperturbable.card,
            trigger: imperturbable.trigger,
        });

        assert.equal(await imperturbableTrigger.canTrigger({
            effect: attack,
            player,
        }), true);
    });
});
