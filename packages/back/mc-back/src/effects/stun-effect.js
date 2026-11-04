import {Calc} from '../engine/calc.js';
import {Effect} from './effect.js';

export class StunEffect extends Effect {
    constructor(params) {
        super(params);

        this.targetCountCalc = params.targetCountCalc;
    }
    async canRun(params) {
        return this.selectUpTo || super.canRun(params);
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
        return !card.isStunned &&
            super.filterTarget.apply(this, arguments);
    }
    execute(params) {
        const {selectedTarget} = this;

        if (Array.isArray(selectedTarget)) {
            return this.promisesSequential(selectedTarget, target => {
                const stunEffect = new StunEffect({
                    selectedTarget: target,
                    match: this.match,
                });

                return stunEffect.runEffect(params);
            });
        }

        selectedTarget.stun();

        selectedTarget.refresh();
    }
}