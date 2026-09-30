import {TIME_PHASE} from '../constants/times.js';
import {TRIGGER_PHASE_ENDS} from '../constants/triggers.js';

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