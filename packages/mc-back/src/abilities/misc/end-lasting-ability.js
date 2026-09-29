import {ConstantAbility} from "./constant-ability.js";

export class EndLastingAbility extends ConstantAbility {
    constructor({
// Ability
        effect, limit, maximum, arrow,
// ConstantAbility
        trigger,
// EndLastingAbility
        lasting,
    }) {
        super(arguments[0]);

        this.lasting = lasting;

        this.isEndLasting = true;
    }
}