import {
   TARGET_SCHEME,
   TRIGGER_PLACE_THREAT,
   TRIGGER_WOULD_PLACE_THREAT,
} from 'mc-shared';

import {placeThreatTokens} from '../utils/token-mutations.js';
import {completeMainSchemeIfThresholdReached} from '../utils/scheme-threat-resolution.js';
import {Effect} from './effect.js';

export class PlaceThreatEffect extends Effect {
    constructor({
        target = TARGET_SCHEME,
        threat,
        isAccelerationThreat = false,
    }) {
        super({...arguments[0], target});

        this.isAccelerationThreat = isAccelerationThreat;
        this._threat = threat;
        this.preventThreat = 0;
    }
    get threat() {
        return this.calcPerPlayer(this._threat) - this.preventThreat;
    }
    set threat(threat) {
        this._threat = threat;
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([
                TRIGGER_PLACE_THREAT,
            ]);
    }
    getTriggersWould() {
        return super.getTriggersWould()
            .concat([
                TRIGGER_WOULD_PLACE_THREAT,
            ]);
    }
    getTriggersEnds(params) {
        return super.getTriggersEnds(params)
            .concat([
                TRIGGER_PLACE_THREAT,
            ]);
    }
    getThreat(params) {
        return this.paramsCalc ?
            this.calculate(params) :
            this.threat;
    }
    getTitle() {
        return this.title || `Colocas ${this.threat} de Amenaza en el Plan principal.`;
    }
    checkTrigger(params) {
        const {preventThreat} = this;
        const threat = this.getThreat(params);

        return preventThreat < threat;
    }
    async execute(params) {
        const targets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget :
            [this.selectedTarget];

        for (const selectedTarget of targets) {
            const threat = this.getThreat(params);

            placeThreatTokens(selectedTarget, threat);

            const completedMainScheme = await completeMainSchemeIfThresholdReached(
                selectedTarget,
                this.match,
                params
            );
            if (!completedMainScheme) {
                selectedTarget.refresh();
            }
        }
    }
}