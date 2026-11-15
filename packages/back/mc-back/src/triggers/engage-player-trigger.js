import {Trigger} from './base/trigger.js';
import {MixinYouTrigger} from './mixins/mixin-you-trigger.js';
import {filterReferentialTargets} from '../utils/referential-ability-utils.js';

export class EngagePlayerTrigger extends MixinYouTrigger(Trigger) {
    constructor(params = {}) {
        super(params);

        const triggerParams = params.triggerParams ?? params;
        this.referentialName = triggerParams.referentialName;
    }
    canTrigger(params) {
        const {referentialName} = this;
        if (referentialName) {
            const eventCard = params.card;
            const referentialTargets = filterReferentialTargets(
                [this.card, eventCard],
                {name: referentialName},
                this.card,
                params.match
            );
            const isReferentialTarget = referentialTargets.some(card =>
                card === eventCard ||
                (card?.id !== undefined && card.id === eventCard?.id));

            if (!isReferentialTarget) {
                return false;
            }
        }

        const player = params.effect?.selectedTarget;

        if (player?.isPlayer) {
            return super.canTrigger({
                ...params,
                player,
            });
        }
    }
    getAbilityParams(params) {
        return super.getAbilityParams({
            ...params,
            player: params.effect?.selectedTarget,
        });
    }
}
