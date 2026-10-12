import {Trigger} from './base/trigger.js';

export class YouPlayCardTrigger extends Trigger {
    canTrigger(params) {
        const {card} = this;
        const controller = card.isEvent ? card.owner : card.controller;

        if (controller && controller === params.player) {
            return super.canTrigger(params);
        }
    }
}
