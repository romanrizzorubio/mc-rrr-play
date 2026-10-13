import {Ability} from '../core/ability.js';

export class WhenCompletedAbility extends Ability {
    constructor({
        effect: _effect, limit: _limit, maximum: _maximum, arrow: _arrow,
    }) {
        super(arguments[0]);

        this.isWhenCompleted = true;
    }
}
