import {ConstantAbility} from './constant-ability.js';

export class EndLastingAbility extends ConstantAbility {
    constructor({
// Ability
        effect: _effect, limit: _limit, maximum: _maximum, arrow: _arrow,
// ConstantAbility
        trigger: _trigger,
// EndLastingAbility
        lasting,
    }) {
        super(arguments[0]);

        this.lasting = lasting;

        this.isEndLasting = true;
    }
}