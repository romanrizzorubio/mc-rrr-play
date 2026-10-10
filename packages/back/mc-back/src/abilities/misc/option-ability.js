import {Ability} from '../core/ability.js';

export class OptionAbility extends Ability {
    constructor({
// Ability
        effect: _effect, limit: _limit, maximum: _maximum, arrow: _arrow,
    }) {
        super(arguments[0]);

        this.parent = null;

        this.isOptionAbility = true;
    }
}