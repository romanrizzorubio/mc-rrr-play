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
        await addCharacterTraits(this, params, this.traits);
    }
}