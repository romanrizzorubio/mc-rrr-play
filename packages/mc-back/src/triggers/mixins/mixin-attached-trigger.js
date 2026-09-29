
export const MixinAttachedTrigger = C => class extends C {
    constructor(params) {
        super(params);
    }
    canTrigger(params) {
        const {card} = this;

        if (card.attachedTo.id === params.card.id) {
            return super.canTrigger(params);
        }
    }
}