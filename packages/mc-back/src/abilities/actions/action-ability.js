import {Ability} from '../core/ability.js';

export class ActionAbility extends Ability {
    constructor({
// Ability
        effect: _effect, limit: _limit, maximum: _maximum, arrow: _arrow,
    }) {
        super(arguments[0]);

        this.isAction = true;
    }

    toObj() {
        return {
            ...super.toObj(arguments[0]),
        };
    }
}