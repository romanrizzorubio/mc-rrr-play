export const MixinTriggeableAbility = C => class extends C {
    constructor({
        trigger,
        triggerParams,
    }) {
        super(arguments[0]);

        this.trigger = trigger;
        this.triggerParams = triggerParams;
    }
    canRun(params, effect = this.effect) {
        if (this.isValidIdentity(params)) {
            return super.canRun(params, effect);
        }

        return false;
    }
    canTrigger(params) {
        return this.canRun(params);
    }
};