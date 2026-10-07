export const MixinThisTrigger = C => class extends C {
    constructor(params) {
        super(params);
    }
    canTrigger(params) {
        const {card} = this;
        const attachedTo = card.attachedTo?.currentSide || card.attachedTo;
        const isThisCard = card === params.card ||
            (card.id !== undefined && card.id === params.card?.id);
        const isAttachedHost = attachedTo &&
            (attachedTo === params.card ||
                (attachedTo.id !== undefined && attachedTo.id === params.card?.id));

        if (isThisCard || isAttachedHost) {
            return super.canTrigger(params);
        }
    }
};