export const MixinResolvedTrigger = C => class extends C {
    constructor(params) {
        super(params);
    }
    canTrigger(params) {
        const {effect} = params;

        if (effect.resolved) {
            return super.canTrigger(params);
        }

        return false;
    }
};