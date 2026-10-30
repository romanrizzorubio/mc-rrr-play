import {Trigger} from './base/trigger.js';
import {path} from '../engine/utils.js';

export class PlayCardTrigger extends Trigger {
    constructor({player}) {
        super(arguments[0]);

        this.playerPath = player;
    }
    canTrigger(params) {
        if (this.playerPath &&
            path({...params, ability: this.ability}, this.playerPath) !== params.player) {
            return false;
        }

        return super.canTrigger(params);
    }
}