export const MixinBasicTrigger = C => class extends C {
    constructor(params) {
        super(params);
    }
    canTrigger(params) {
        const {effect} = params;

        if (effect.ability && effect.ability.isBasic) {
            return super.canTrigger(params);
        }

        return false;
    }
};
