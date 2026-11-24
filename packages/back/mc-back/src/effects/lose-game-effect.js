import {MATCH_END_REASON_SCENARIO_FAILED} from 'mc-shared';

import {Effect} from './effect.js';

export class LoseGameEffect extends Effect {
    constructor({
        reason = MATCH_END_REASON_SCENARIO_FAILED,
    }) {
        super(arguments[0]);

        this.reason = reason;
    }
    async execute() {
        await this.match.finishGame(this.reason);
    }
}
