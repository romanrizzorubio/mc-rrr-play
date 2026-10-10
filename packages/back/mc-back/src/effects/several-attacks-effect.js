import {TARGET_YOU} from 'mc-shared';

import {Ability} from '../abilities/core/ability.js';
import {ValidTarget} from '../targets/valid-target.js';

import {EnemyAttackEffect} from './enemy-attack-effect.js';
import {SeveralActivationsEffect} from './several-activations-effect.js';

export class SeveralAttacksEffect extends SeveralActivationsEffect {
    constructor({
        attackTarget = TARGET_YOU,
        ...params
    }) {
        super(params);

        this.attackTarget = attackTarget;
        this.attacks = [];
    }
    async prepare(params) {
        this.attacks = [];

        return super.prepare(params);
    }
    async activate(enemy, params) {
        const attackTarget = new ValidTarget({
            effect: this,
            filter: this.filterTarget.bind(this),
            match: this.match,
        });
        const targets = await attackTarget.selectTarget({
            ...params,
            ability: this.ability,
            card: enemy,
            target: this.attackTarget,
        });
        const selectedTargets = Array.isArray(targets) ?
            targets :
            targets ? [targets] : [];

        return this.promisesSequential(selectedTargets, target =>
            this.resolveAttack(enemy, target, params));
    }
    async resolveAttack(enemy, target, params) {
        const enemyAttackEffect = new EnemyAttackEffect({
            character: enemy,
            selectedTarget: target,
            match: this.match,
            enemy,
        });

        const ability = new Ability({
            effect: enemyAttackEffect,
            card: enemy,
            match: this.match,
        });

        await ability.resolveAbility({
            ...params,
            player: target,
        });

        if (enemyAttackEffect.resolved) {
            this.attacks.push(enemyAttackEffect);
        }
    }
}