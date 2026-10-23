import {Effect} from './effect.js';
import {getAttachmentHost} from '../utils/attachment-utils.js';
import {checkCondition} from '../engine/utils.js';
import {splitTargetCondition} from '../utils/target-condition-utils.js';

export class AttachEffect extends Effect {
    constructor({
        card,
        fallbackCondition,
        fallbackTarget,
    }) {
        super(arguments[0]);

        this.card = card;
        this.fallbackCondition = fallbackCondition;
        this.fallbackTarget = fallbackTarget;
        this.usingFallbackTarget = false;
    }
    async getValidTarget(params) {
        const targets = await super.getValidTarget(params);
        if (targets.length || !this.fallbackTarget || this.usingFallbackTarget) {
            return targets;
        }

        this.usingFallbackTarget = true;
        this.target = this.fallbackTarget;
        this.condition = this.fallbackCondition;
        this.validTarget.condition = this.fallbackCondition;

        return super.getValidTarget(params);
    }
    async selectTarget(params) {
        if (!(await this.getValidTarget(params)).length) {
            return null;
        }

        return super.selectTarget(params);
    }
    filterTarget(target, params) {
        const {condition} = splitTargetCondition(this.condition);
        if (!super.filterTarget(target, params) ||
            (condition && !checkCondition(target, condition))) {
            return false;
        }

        return this.card.canAttach(target, params.player);
    }

    async execute(_params) {
        const {card, selectedTarget} = this;
        const attachedTo = getAttachmentHost(selectedTarget);

        attachedTo.attached.push(card);
        card.attachedTo = attachedTo;

        await attachedTo.refresh();
    }
}