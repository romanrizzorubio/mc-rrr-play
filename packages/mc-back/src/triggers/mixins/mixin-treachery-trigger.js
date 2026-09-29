export const MixinTreacheryTrigger = C => class extends C {
    constructor(params) {
        super(params);
    }
    canTrigger(params) {
        const {effect} = params;

        if (effect.selectedTarget.isTreachery) {
            return super.canTrigger(params);
        }

        return false;
    }
}