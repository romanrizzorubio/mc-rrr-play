import {Effect} from './effect.js';

export class ChainedEffect extends Effect {
    constructor({
// ChainedEffect
        effects = [],
        matchAll = false,
    }) {
        super(arguments[0]);

        this.effects = effects;
        this.matchAll = matchAll;

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
    canRun(params) {
        const newParams = {
            ...params,
            effects: this.effects,
        };

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
    execute(params) {
        const matchAll = this.matchAll || params.matchAll;
        const newParams = {
            ...params,
            effects: this.effects,
        };

        return this.promisesSequential(this.effects, async effect => {
            if (await effect.canRun(newParams)) {
                await effect.runEffect(newParams);

                if (matchAll && !effect.isFullResolved()) {
                    return false;
                }
            } else {
                return false;
            }
        });
    }
}