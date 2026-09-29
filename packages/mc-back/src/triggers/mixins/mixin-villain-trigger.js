export const MixinVillainTrigger = C => class extends C {
    constructor(params) {
        super(params);
    }
    getVillain(params) {
        const {effect} = params;

        return effect.selectedTarget;
    }
    canTrigger(params) {
        const villain = this.getVillain(params);

        if (villain.isVillain) {
            return super.canTrigger(params);
        }

        return false;
    }
}