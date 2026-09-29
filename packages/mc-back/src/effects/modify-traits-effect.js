import {Effect} from "./effect.js";

export const EFFECT_MODIFY_TRAITS = 'modify-traits';
export class ModifyTraitsEffect extends Effect {
    constructor({
        traits,
        characters,
    }) {
        super(arguments[0]);

        this.traits = traits;
    }
    async prepare(params) {
        await super.prepare(params);
    }
    execute(params) {
        const {selectedTarget, traits} = this;

        selectedTarget.modifyTraits = traits.slice();
    }
}