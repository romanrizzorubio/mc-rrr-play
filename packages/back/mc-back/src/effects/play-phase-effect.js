import {TARGET_PHASE, TRIGGER_PHASE_ENDS} from 'mc-shared';

import {Effect} from './effect.js';

export class PlayPhaseEffect extends Effect {
    getTriggersEnds() {
        return super.getTriggersEnds()
            .concat([
                TRIGGER_PHASE_ENDS,
            ]);
    }

    triggerEnds(params, options) {
        return super.triggerEnds({
            ...params,
            match: params.match ?? this.match,
        }, {
            ...options,
            resolveInterrupts: true,
        });
    }

    async execute() {
        await this.endLimit(TARGET_PHASE);
    }
}