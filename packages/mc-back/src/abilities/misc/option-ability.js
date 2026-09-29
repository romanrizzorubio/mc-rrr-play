import {Ability} from "../core/ability.js";

export const ABILITY_OPTION = 'option';
export class OptionAbility extends Ability {
    constructor({
// Ability
        effect, limit, maximum, arrow,
    }) {
        super(arguments[0]);

        this.parent = null;

        this.isOptionAbility = true;
    }
}