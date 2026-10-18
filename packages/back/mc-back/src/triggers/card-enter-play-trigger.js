import {Trigger} from './base/trigger.js';
import {checkCondition} from '../engine/utils.js';

export class CardEnterPlayTrigger extends Trigger {
    constructor({
        beforeEnterPlay = false,
        cardCondition,
        matchSource = cardCondition === undefined,
        ...params
    }) {
        super(params);

        this.beforeEnterPlay = beforeEnterPlay;
        this.cardCondition = cardCondition;
        this.matchSource = matchSource;
    }
    canTrigger(params) {
        if (params.card &&
            this.matchesTiming(params.card) &&
            (!this.cardCondition || checkCondition(params.card, this.cardCondition)) &&
            (!this.matchSource || this.matchesSource(params.card))) {
            return super.canTrigger(this.getCardParams(params));
        }
    }
    matchesTiming(card) {
        return this.beforeEnterPlay ? !card.isInPlay : card.isInPlay;
    }
    matchesSource(card) {
        const attachedTo = this.card.attachedTo?.currentSide || this.card.attachedTo;
        const isThisCard = this.card === card ||
            (this.card.id !== undefined && this.card.id === card.id);
        const isAttachedHost = attachedTo &&
            (attachedTo === card ||
                (attachedTo.id !== undefined && attachedTo.id === card.id));

        return isThisCard || isAttachedHost;
    }
    getCardParams(params) {
        return {
            ...params,
            triggeredCard: params.card,
        };
    }
    runCard(params) {
        return super.runCard(this.getCardParams(params));
    }
}
