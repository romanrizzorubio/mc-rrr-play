export const MixinThwartTrigger = C => class extends C {
    constructor(params) {
        super(params);
    }
    canTrigger(params) {
        const {effect} = params;

        if (effect && effect.isThwart) {
            return super.canTrigger(params);
        }

        return false;
    }
};
