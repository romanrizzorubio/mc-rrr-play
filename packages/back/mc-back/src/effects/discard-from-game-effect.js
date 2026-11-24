import {
    EFFECT_CATEGORY_LEAVE_PLAY,
    TRIGGER_CARD_WOULD_BE_DISCARDED,
} from 'mc-shared';

import {Effect} from './effect.js';

export class DiscardFromGameEffect extends Effect {
    constructor(params) {
        super(params);

        this.cards = [];
        this.additionalZoneCardsAtTrigger = new Set();
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.cards = [];
        this.additionalZoneCardsAtTrigger = new Set();
    }
    get effectCategories() {
        return [EFFECT_CATEGORY_LEAVE_PLAY];
    }
    getTriggersWould(params) {
        const targets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget.flat(Infinity) :
            [this.selectedTarget];

        return [
            ...super.getTriggersWould(params),
            ...(targets.some(target => target?.isInPlay) ?
                [TRIGGER_CARD_WOULD_BE_DISCARDED] :
                []),
        ];
    }
    getTriggersParams(params) {
        this.additionalZoneCardsAtTrigger = new Set(
            Object.values(this.match?.scenario?.additionalZones || {})
                .flatMap(zone => zone.cards)
        );

        return {
            ...super.getTriggersParams(params),
            triggeredTarget: this.selectedTarget,
        };
    }
    async execute() {
        const targets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget : [this.selectedTarget];
        this.cards = targets;
        const scenario = this.match?.scenario;
        for (const target of targets) {
            const {attachedTo, controller} = target;
            if (typeof scenario?.findAdditionalZoneForCard === 'function' &&
                scenario.findAdditionalZoneForCard(target) &&
                !this.additionalZoneCardsAtTrigger.has(target)) {
                continue;
            }
            await target.discard({skipWouldDiscardTrigger: true});
            if (attachedTo) {
                await attachedTo.refresh?.();
            } else if (controller) {
                const gameZone = controller.gameZone;
                if (gameZone?.match?.mc?.mcSocket) {
                    await gameZone.refresh();
                }
            }
            if (typeof controller?.deck?.refresh === 'function') {
                await controller.deck.refresh();
            }
        }
    }
}