export const MixinYouDefeatTrigger = C => class extends C {
    constructor(params) {
        super(params);
    }
    getYou(params) {
        const {effect} = params;

        return effect.selectedTarget;
    }
}