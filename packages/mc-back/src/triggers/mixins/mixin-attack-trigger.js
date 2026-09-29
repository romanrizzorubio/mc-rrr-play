export const MixinAttackTrigger = C => class extends C {
    constructor(params) {
        super(params);
    }
    canTrigger(params) {
        const {effect} = params;

        if (effect.isAttack) {
            return super.canTrigger(params);
        }

        return false;
    }
}