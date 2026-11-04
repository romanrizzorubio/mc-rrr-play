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
        const wasMinion = params.effect.defeatedCharacterState?.isMinion ??
            minion.isMinion;

        if (wasMinion) {
            return super.canTrigger(params);
        }

        return false;
    }
};