import {TARGET_YOU} from 'mc-shared';
import {DoIfEffect} from './do-if-effect.js';

export class DoIfTakeCharacterDamageEffect extends DoIfEffect {
    constructor({
// DoIfEffect
        condition,
        effect: _effect,
        effectNot: _effectNot
    }) {
        super(arguments[0]);

        this.condition = condition;
    }
    getValidTarget(params) {
        const source = this.getSource(params);

        return source && this.filterTarget(source, params) ? [source] : [];
    }
    prepare(params) {
        this.selectedTarget = this.getSource(params);
    }
    checkCondition(params) {
        const attack = this.selectedTarget.activation;
        const {takenDamage} = attack;
        const damageAmounts = Array.isArray(takenDamage) ? takenDamage : [takenDamage];

        if (!damageAmounts.some(damage => damage > 0)) {
            return false;
        }
        if (this.target === TARGET_YOU) {
            return true;
        }

        const targetSet = this.validTarget.getValidTarget({
            ...params,
            effect: this,
            target: this.target,
        });
        const damageTargets = attack.attackedTargets ||
            attack.effect.attacked ||
            attack.selectedTarget;
        const attackedTargets = Array.isArray(damageTargets) ?
            damageTargets :
            [damageTargets];

        return attackedTargets.some((target, index) =>
            damageAmounts[index] > 0 &&
            targetSet.includes(target?.isPlayer ? target.superhero.currentSide : target)
        );
    }
    execute(params) {
        return super.execute({
            ...params,
            attack: this.selectedTarget.activation,
        });
    }
}