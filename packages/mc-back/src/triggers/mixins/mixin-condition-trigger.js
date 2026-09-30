import {checkCondition, path} from '../../engine/utils.js';

export const MixinConditionTrigger = C => class extends C {
    constructor({
        conditionTrigger,
        conditionSource,
    }) {
        super(arguments[0]);

        this.conditionTrigger = conditionTrigger;
        this.conditionSource = conditionSource;
    }
    canTrigger(params) {
        const {conditionTrigger, conditionSource} = this;

        const target = path(params, conditionSource);

        if (checkCondition(target, conditionTrigger)) {
            return super.canTrigger(params);
        }
    }
};