import {TRIGGER_THIS_SPEND} from 'mc-shared';

import {Effect} from './effect.js';

export class DiscardFromHandEffect extends Effect {
    constructor({resourcePayment = false}) {
        super(arguments[0]);

        this.resourcePayment = resourcePayment;
    }
    getTriggersEnds(params) {
        return this.resourcePayment ?
            [TRIGGER_THIS_SPEND] :
            super.getTriggersEnds(params);
    }
    getTriggersParams(params) {
        const triggerParams = super.getTriggersParams(params);
        if (!this.resourcePayment) {
            return triggerParams;
        }

        return {
            ...triggerParams,
            card: this.selectedTarget,
            triggeredCard: this.selectedTarget,
        };
    }
    async triggerEnds(params, options) {
        try {
            await super.triggerEnds(params, options);
        } finally {
            if (this.resourcePayment) {
                const cleanup = () => this.selectedTarget.endTriggers();
                if (params.costPaymentSession?.committing) {
                    params.costPaymentSession.deferResponse(cleanup);
                } else {
                    cleanup();
                }
            }
        }
    }
    async execute(params) {
        const {player} = params;

        const {selectedTarget} = this;

        if (selectedTarget.isEvent && !this.resourcePayment) {
            selectedTarget.endTriggers();
        }

        await player.hand.discardHand(selectedTarget, {
            preserveTriggers: this.resourcePayment,
        });
        await player.hand.refresh();

        await player.deck.discard(selectedTarget);
        player.deck.refresh();
    }
}