import {Effect} from './effect.js';
import {removeDamageTokens} from '../utils/token-mutations.js';
import {Calc} from '../engine/calc.js';

export class HealEffect extends Effect {
    constructor({
// HealEffect
        character: _character,
        damage,
        target: _target,
        allowNoDamage = false,
        targetCountCalc,
    }) {
        super(arguments[0]);

        this.damage = damage;
        this.allowNoDamage = allowNoDamage;
        this.targetCountCalc = targetCountCalc;
    }
    async resolveParams(params) {
        const resolvedParams = await super.resolveParams(params);

        if (!this.targetCountCalc) {
            return resolvedParams;
        }

        const selectCount = await new Calc(this.targetCountCalc)
            .calculate({
                ...resolvedParams,
                match: resolvedParams.match ?? this.match,
                effect: this,
            });
        if (!Number.isSafeInteger(selectCount) || selectCount < 0) {
            throw new Error(
                'El número calculado de objetivos debe ser un entero no negativo.'
            );
        }

        this.selectCount = selectCount;

        return {
            ...resolvedParams,
            selectCount,
        };
    }
    filterTarget(card) {
        return (this.allowNoDamage || card.canHeal) &&
            super.filterTarget.apply(this, arguments);
    }
    async canRun(params) {
        if (!await super.canRun(params)) {
            return false;
        }

        if (!this.paramsCalc || this.allowNoDamage) {
            return true;
        }

        return (await this.calculate(params)) > 0;
    }

    async execute(params) {
        const {selectedTarget} = this;
        const targets = Array.isArray(selectedTarget) ?
            selectedTarget :
            [selectedTarget];

        const damage = this.paramsCalc ?
            await this.calculate(params) :
            this.damage;

        for (const target of targets) {
            await removeDamageTokens(target, damage);
            await target.refresh();
        }
    }
}