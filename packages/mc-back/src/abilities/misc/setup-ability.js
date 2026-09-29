import {Ability} from "../core/ability.js";

export const ABILITY_SETUP = 'setup';
export class SetupAbility extends Ability {
    constructor({
// Ability
        effect,
    }) {
        super(arguments[0]);

        this.isSetup = true;
    }
}