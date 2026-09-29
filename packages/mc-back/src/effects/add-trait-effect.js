import {Effect} from "./effect.js";

export const EFFECT_ADD_TRAIT = 'add-trait';
export class AddTraitEffect extends Effect {
    constructor({
        trait,
        characterTarget,
    }) {
        super(arguments[0]);

        this.characterTarget = characterTarget;
        this.trait = trait;
    }
    execute(params) {
        const {selectedTarget, trait} = this;

        if (selectedTarget && selectedTarget.extraTraits) {
            if (!selectedTarget.extraTraits.includes(trait)) {
                selectedTarget.extraTraits.push(trait);
            }
        }
    }
}
