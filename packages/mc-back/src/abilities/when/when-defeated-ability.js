import {Ability} from "../core/ability.js";

export const ABILITY_WHEN_DEFEATED = 'when-defeated';
export class WhenDefeatedAbility extends Ability {
    constructor({
// Ability
        effect, limit, maximum, arrow,
    }) {
        super(arguments[0]);

        this.isWhenDefeated = true;
    }
}