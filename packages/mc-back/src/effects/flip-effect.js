import {Effect} from "./effect.js";
import {TARGET_ALTEREGO, TARGET_ALTEREGO_SIDE, TARGET_HERO, TARGET_HERO_SIDE} from "../constants/targets.js";
import {ValidTarget} from "../engine/valid-target.js";

export const EFFECT_FLIP = 'flip';
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
    }
}