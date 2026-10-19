import {Effect} from './effect.js';

export class ToughEffect extends Effect {
    filterTarget(card) {
        return !card.isTough &&
            super.filterTarget.apply(this, arguments);
    }
    execute(params) {
        const {selectedTarget} = this;

        if (Array.isArray(selectedTarget)) {
            return this.promisesSequential(selectedTarget, target => {
                const toughEffect = new ToughEffect({
                    selectedTarget: target,
                    match: this.match,
                });

                return toughEffect.runEffect(params);
            });
        }

        selectedTarget.setTough();

        selectedTarget.refresh();
    }
}