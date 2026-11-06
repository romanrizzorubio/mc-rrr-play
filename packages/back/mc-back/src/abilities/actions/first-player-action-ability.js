import {ActionAbility} from './action-ability.js';

export class FirstPlayerActionAbility extends ActionAbility {
    canRun(params) {
        if (params.player !== this.match?.initialPlayer) {
            return false;
        }

        return super.canRun(params);
    }
}
