import {Ability} from "../core/ability.js";

export const ABILITY_ACTION = 'action';
export class ActionAbility extends Ability {
    constructor({
// Ability
        effect, limit, maximum, arrow,
    }) {
        super(arguments[0]);

        this.isAction = true;
    }

    toObj() {
        return {
            ...super.toObj(arguments[0]),
        }
    }
}