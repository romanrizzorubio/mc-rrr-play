import {Ability} from '../abilities/core/ability.js';
import {TARGET_MAIN_SCHEME, TARGET_YOU} from '../constants/targets.js';

import {Effect} from './effect.js';
import {EnemyAttackEffect} from './enemy-attack-effect.js';
import {EnemySchemeEffect} from './enemy-scheme-effect.js';

export class ActivateEffect extends Effect {
    attack(params) {
        const {selectedTarget} = this;
        const {player} = params;

        const enemyAttackEffect = new EnemyAttackEffect({
            target: TARGET_YOU,
            player,
            match: this.match,
            enemy: selectedTarget,
        });

        const ability = new Ability({
            effect: enemyAttackEffect,
            card: selectedTarget,
            match: this.match,
        });

        return ability.resolveAbility(params);
    }
    scheme(params) {
        const {selectedTarget} = this;
        const {player} = params;

        const enemySchemeEffect = new EnemySchemeEffect({
            target: TARGET_MAIN_SCHEME,
            player,
            match: this.match,
            enemy: selectedTarget,
        });

        const ability = new Ability({
            effect: enemySchemeEffect,
            card: selectedTarget,
            match: this.match,
        });

        return ability.resolveAbility(params);
    }
    execute(params) {
        const {player} = params;

        if (player.isHero) {
            return this.attack(params);
        } else if (player.isAlterEgo) {
            return this.scheme(params);
        }
    }
}