import {SeveralActivationsEffect} from "./several-activations-effect.js";
import {EnemyAttackEffect} from "./enemy-attack-effect.js";
import {Ability} from "../abilities/core/ability.js";

export const EFFECT_SEVERAL_ATTACKS = 'several-attacks';
export class SeveralAttacksEffect extends SeveralActivationsEffect {
    activate(enemy, params) {
        const {player} = params;

        const enemyAttackEffect = new EnemyAttackEffect({
            character: enemy,
            selectedTarget: player,
            match: this.match,
            enemy,
        });

        const ability = new Ability({
            effect: enemyAttackEffect,
            card: enemy,
            match: this.match,
        });

        return ability.resolveAbility(params);
    }
}