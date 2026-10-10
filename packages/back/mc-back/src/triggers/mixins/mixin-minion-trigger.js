export const MixinMinionTrigger = C => class extends C {
    constructor(params) {
        super(params);
    }
    getMinion(params) {
        const {effect} = params;

        return effect.selectedTarget;
    }
    canTrigger(params) {
        const minion = this.getMinion(params);

        if (minion.isMinion) {
            return super.canTrigger(params);
        }

        return false;
    }
};