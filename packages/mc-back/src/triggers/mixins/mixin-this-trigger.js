export const MixinThisTrigger = C => class extends C {
    constructor(params) {
        super(params);
    }
    canTrigger(params) {
        const {card} = this;

        if (card.id === params.card.id) {
            return super.canTrigger(params);
        }
    }
};