import {Ability} from '../core/ability.js';

export class SetupAbility extends Ability {
    constructor({
// Ability
        effect: _effect,
    }) {
        super(arguments[0]);

        this.isSetup = true;
    }
}