import {Effect} from './effect.js';

export class ConfuseEffect extends Effect {
    filterTarget(card) {
        return !card.isConfused &&
            super.filterTarget.apply(this, arguments);
    }
    execute(params) {
        const {selectedTarget} = this;

        if (selectedTarget instanceof Array) {
            return this.promisesSequential(selectedTarget, target => {
                const confuseEffect = new ConfuseEffect({
                    selectedTarget: target,
                    match: this.match,
                });

                return confuseEffect.runEffect(params);
            });
        }

        selectedTarget.confuse();
        selectedTarget.refresh();
    }
}