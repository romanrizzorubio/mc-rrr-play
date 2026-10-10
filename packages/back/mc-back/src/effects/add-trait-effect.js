import {Effect} from './effect.js';
import {addCharacterTraits} from '../utils/trait-utils.js';

export class AddTraitEffect extends Effect {
    constructor({
        trait,
        characterTarget,
    }) {
        super(arguments[0]);

        this.characterTarget = characterTarget;
        this.trait = trait;
    }
    async execute(params) {
        await addCharacterTraits(this, params, [this.trait]);
    }
}
