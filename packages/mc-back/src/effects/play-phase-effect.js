import {Effect} from "./effect.js";
import {TIME_PHASE} from "../constants/times.js";
import {TRIGGER_PHASE_ENDS} from "../triggers/phase-ends-trigger.js";

export class PlayPhaseEffect extends Effect {
    getTriggersEnds() {
        return super.getTriggersEnds()
            .concat([
                TRIGGER_PHASE_ENDS,
            ]);
    }

    async execute(params) {
        await this.endLimit(TIME_PHASE);
    }
}