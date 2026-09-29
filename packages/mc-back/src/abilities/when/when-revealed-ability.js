import {Ability} from "../core/ability.js";

export const ABILITY_WHEN_REVEALED = 'when-revealed';
export class WhenRevealedAbility extends Ability {
    constructor({
// Ability
        effect, limit, maximum, arrow
    }) {
        super(arguments[0]);

        this.isWhenRevealed = true;
    }
}