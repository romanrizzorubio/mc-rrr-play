import {checkCondition, path} from '../../engine/utils.js';

export const MixinConditionTrigger = C => class extends C {
    constructor({
        conditionTrigger,
        conditionSource,
    }) {
        super(arguments[0]);

        if ((conditionSource === undefined) !== (conditionTrigger === undefined)) {
            throw new Error('conditionSource and conditionTrigger must be configured together');
        }

        this.conditionTrigger = conditionTrigger;
        this.conditionSource = conditionSource;
    }
    canTrigger(params) {
        const {conditionTrigger, conditionSource} = this;

        if (conditionSource === undefined) {
            return super.canTrigger(params);
        }

        const target = path(params, conditionSource);

        if (checkCondition(target, conditionTrigger)) {
            return super.canTrigger(params);
        }
    }
};