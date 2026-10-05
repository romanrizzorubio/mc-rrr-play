import {Effect} from './effect.js';
import {addCharacterTraits} from '../utils/trait-utils.js';

export class ModifyTraitsEffect extends Effect {
    constructor({
        traits,
        characters: _characters,
    }) {
        super(arguments[0]);

        this.traits = traits;
    }
    async prepare(params) {
        await super.prepare(params);
    }
    async execute(params) {
        const {selectedTarget} = this;

        if (selectedTarget && Array.isArray(selectedTarget.modifyTraits)) {
            selectedTarget.modifyTraits.push(...this.traits);
            return;
        }

        await addCharacterTraits(this, params, this.traits);
    }
}