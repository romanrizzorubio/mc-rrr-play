import {Effect} from './effect.js';

export class ChainedEffect extends Effect {
    constructor({
// ChainedEffect
        effects = [],
        matchAll = false,
        outputParams = [],
    }) {
        super(arguments[0]);

        this.effects = effects;
        this.matchAll = matchAll;
        this.outputParams = outputParams;

        effects.forEach(effect => {
            if (!effect) {
                console.log('asdf');
            }
            if (!effect.target) {
                effect.target = this.target;
            }

            return effect;
        });
    }
    get ability() {
        return super.ability;
    }
    set ability(ability) {
        this._ability = ability;
        this.effects.forEach(effect => {
            effect.ability = ability;
        });
    }
    get activationEnd() {
        return this.effects.every(effect => effect.activationEnd);
    }
    isResolved() {
        return this.effects.some(effect => effect.isResolved());
    }
    isFullResolved() {
        return this.effects.every(effect => effect.isFullResolved());
    }
    getCostPaymentEffects(params) {
        const newParams = this.getEffectParams(params);

        return this.effects.flatMap(effect =>
            effect.getCostPaymentEffects(newParams));
    }
    getEffectParams(params) {
        const {selectedTarget} = this;
        const targetPlayer = selectedTarget && selectedTarget.isPlayer ?
            selectedTarget :
            params.targetPlayer;

        return {
            ...params,
            effects: this.effects,
            ...(targetPlayer ? {targetPlayer} : {}),
        };
    }
    canRun(params) {
        const newParams = this.getEffectParams(params);

        if (this.matchAll || params.matchAll) {
            return this.promisesSequentialEvery(this.effects, effect =>
                effect.canRun(newParams));
        }

        return this.promisesSequentialSome(this.effects, effect =>
            effect.canRun(newParams));
    }
    async prepare(params) {
        await super.prepare(params);

        await this.promisesSequential(this.effects, async effect => {
            if (effect.target === this.target) {
                effect.selectedTarget = this.selectedTarget;
            }
        });

        return this.selectedTarget;
    }
    async prepareCost(params, session) {
        if (!await super.prepareCost(params, session)) {
            return false;
        }

        const {effectParams} = session.getPreparedEffect(this);
        const newParams = this.getEffectParams(effectParams);
        session.prepareExecutionParams(this, newParams);

        for (const effect of this.effects) {
            if (!await effect.prepareCost(newParams, session)) {
                return false;
            }
        }

        return true;
    }
    async execute(params) {
        const matchAll = this.matchAll || params.matchAll;
        const newParams = params.costPaymentSession?.getExecutionParams(this) ||
            this.getEffectParams(params);

        await this.promisesSequential(this.effects, async effect => {
            if (newParams.costPaymentSession?.isPrepared(effect) ||
                await effect.canRun(newParams)) {
                await effect.runEffect(newParams);

                if (effect.paymentCancelled) {
                    this.paymentCancelled = true;
                    return false;
                }

                if (matchAll && !effect.isFullResolved()) {
                    return false;
                }
            } else {
                return false;
            }
        });

        this.outputParams.forEach(param => {
            params[param] = newParams[param];
        });
    }
}