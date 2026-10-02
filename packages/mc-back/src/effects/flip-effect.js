import {
    PRIORITY_CONSTANT,
    PRIORITY_FORCED_RESPONSE,
    PRIORITY_RESPONSE
} from '../constants/priorities.js';
import { TARGET_ALTEREGO_SIDE, TARGET_HERO_SIDE} from '../constants/targets.js';
import {TRIGGER_THIS_FLIP} from '../constants/triggers.js';
import {ValidTarget} from '../targets/valid-target.js';

import {Effect} from './effect.js';

export class FlipEffect extends Effect {
    constructor({
        formTarget,
        selectedFormTarget,
    }) {
        super(arguments[0]);

        this.formTarget = formTarget;
        this.selectedFormTarget = selectedFormTarget;
    }
    filterTarget(card) {
        if (super.filterTarget.apply(this, arguments)) {
            const {formTarget} = this;

            switch (formTarget) {
                case TARGET_ALTEREGO_SIDE:
                    return !card.isAlterEgo;
                case TARGET_HERO_SIDE:
                    return !card.isHero;
            }

            return true;
        }

        return false;
    }

    async prepare(params) {
        await super.prepare(params);

        if (!this.selectedFormTarget) {
            const {formTarget} = this;

            const validTarget = new ValidTarget({
                match: this.match,
            });

            this.selectedFormTarget = await validTarget.selectTarget({
                ...params,
                card: this.selectedTarget,
                target: formTarget,
            });
        }
    }

    async execute(params) {
        const {selectedTarget, selectedFormTarget} = this;
        const {sides} = selectedTarget;
        const {own} = params;

        const oldSide = selectedTarget.currentSide;
        oldSide.endTriggers();

        selectedTarget.selectedSide = sides.indexOf(selectedFormTarget);
        if (own) {
            selectedTarget.flipped = true;
        }

        selectedFormTarget.initTriggers();

        selectedTarget.refresh();
        const {owner} = selectedTarget;
        if (owner && owner.isPlayer) {
            await owner.hand.refresh();
        }

        const triggerParams = {
            ...params,
            card: selectedTarget,
        };

        await this.trigger(PRIORITY_CONSTANT, TRIGGER_THIS_FLIP, triggerParams);
        await this.trigger(PRIORITY_FORCED_RESPONSE, TRIGGER_THIS_FLIP, triggerParams);
        await this.trigger(PRIORITY_RESPONSE, TRIGGER_THIS_FLIP, triggerParams);
    }
}