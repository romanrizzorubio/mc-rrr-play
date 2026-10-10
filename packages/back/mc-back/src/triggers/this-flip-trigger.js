import {Trigger} from './base/trigger.js';
import {MixinThisTrigger} from './mixins/mixin-this-trigger.js';

export class ThisFlipTrigger extends MixinThisTrigger(Trigger) {
    canTrigger(params) {
        const {card} = this;
        const flippedCard = params.card?.currentSide || params.card;
        const isThisCard = flippedCard &&
            (card === flippedCard ||
                (card.id !== undefined && card.id === flippedCard.id));

        if (isThisCard) {
            return Trigger.prototype.canTrigger.call(this, params);
        }

        return super.canTrigger(params);
    }
}
