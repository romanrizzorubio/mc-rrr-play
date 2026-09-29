import {Effect} from "./effect.js";

export const EFFECT_STUN = 'stun';
export class StunEffect extends Effect {
    filterTarget(card) {
        return !card.isStunned &&
            super.filterTarget.apply(this, arguments);
    }
    execute(params) {
        const {selectedTarget} = this;

        if (selectedTarget instanceof Array) {
            return this.promisesSequential(selectedTarget, target => {
                const stunEffect = new StunEffect({
                    selectedTarget: target,
                    match: this.match,
                });

                return stunEffect.runEffect(params);
            })
        }

        selectedTarget.stun();

        selectedTarget.refresh();
    }
}