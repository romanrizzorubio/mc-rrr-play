import {Effect} from './effect.js';

export class RemoveTraitEffect extends Effect {
    constructor({
        traits = [],
    }) {
        super(arguments[0]);

        this.traits = traits;
    }
    async execute() {
        const {selectedTarget, traits} = this;
        const extraTraits = selectedTarget.extraTraits.filter(trait =>
            !traits.includes(trait));

        if (extraTraits.length !== selectedTarget.extraTraits.length) {
            selectedTarget.extraTraits = extraTraits;
            await selectedTarget.refresh();
        }
    }
}
