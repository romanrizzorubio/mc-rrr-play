import {TIME_PHASE,TRIGGER_PHASE_ENDS} from 'mc-shared';

import {Effect} from './effect.js';

export class PlayPhaseEffect extends Effect {
    getTriggersEnds() {
        return super.getTriggersEnds()
            .concat([
                TRIGGER_PHASE_ENDS,
            ]);
    }

    async execute() {
        await this.endLimit(TIME_PHASE);
    }
}