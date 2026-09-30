import {Effect} from './effect.js';

export class AddTraitEffect extends Effect {
    constructor({
        trait,
        characterTarget,
    }) {
        super(arguments[0]);

        this.characterTarget = characterTarget;
        this.trait = trait;
    }
    execute(_params) {
        const {selectedTarget, trait} = this;

        if (selectedTarget && selectedTarget.extraTraits) {
            if (!selectedTarget.extraTraits.includes(trait)) {
                selectedTarget.extraTraits.push(trait);
            }
        }
    }
}
