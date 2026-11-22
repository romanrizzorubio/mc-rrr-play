import {Trigger} from './base/trigger.js';
import {checkCondition} from '../engine/utils.js';
import {hasEffectiveTraits} from '../utils/has-effective-traits.js';

export class CardEnterPlayTrigger extends Trigger {
    constructor({
        cardCondition,
        traits,
        usePlayedBy = false,
        matchSource = cardCondition === undefined,
        ...params
    }) {
        super(params);

        this.cardCondition = cardCondition;
        this.traits = traits;
        this.usePlayedBy = usePlayedBy;
        this.matchSource = matchSource;
    }
    async canTrigger(params) {
        if (!params.card ||
            !this.matchesTiming(params.card) ||
            (this.cardCondition &&
                !checkCondition(params.card, this.cardCondition)) ||
            (this.matchSource && !this.matchesSource(params.card)) ||
            (this.usePlayedBy && !params.playedBy?.isPlayer)) {
            return;
        }

        if (this.traits &&
            !await hasEffectiveTraits(params.card, this.traits, params.player)) {
            return;
        }

        return super.canTrigger(this.getCardParams(params));
    }
    matchesTiming(card) {
        return this.ability?.isInterrupt ? !card.isInPlay : card.isInPlay;
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
    getAbilityParams(params) {
        const abilityParams = super.getAbilityParams(params);
        if (!this.usePlayedBy || !params.playedBy?.isPlayer) {
            return abilityParams;
        }

        return {
            ...abilityParams,
            player: params.playedBy,
            targetPlayer: params.playedBy,
        };
    }
    runCard(params) {
        return super.runCard(this.getCardParams(params));
    }
}
