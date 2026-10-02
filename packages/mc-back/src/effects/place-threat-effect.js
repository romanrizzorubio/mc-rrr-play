import {
   TARGET_SCHEME,
   TRIGGER_PLACE_THREAT,
   TRIGGER_WOULD_PLACE_THREAT,
   EFFECT_DEFEAT,
} from 'mc-shared';

import {Effect} from './effect.js';

export class PlaceThreatEffect extends Effect {
    constructor({
        target = TARGET_SCHEME,
        threat,
    }) {
        super(arguments[0]);

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
    getThreat(params) {
        return this.paramsCalc ?
            this.calculate(params) :
            this.threat;
    }
    getTitle() {
        return `Colocas ${this.threat} de Amenaza en el Plan principal.`;
    }
    checkTrigger(params) {
        const {preventThreat} = this;
        const threat = this.getThreat(params);

        return preventThreat < threat;
    }
    async execute(params) {
        const {selectedTarget} = this;

        const threat = this.getThreat(params);

        selectedTarget.placeThreat(threat);

        selectedTarget.refresh();

        if (selectedTarget.isMain) {
            if (selectedTarget.threat >= selectedTarget.card.value) {
                const defeatEffect = this.match.effectsFactory.createEffect({
                    type: EFFECT_DEFEAT,
                    selectedTarget,
                });

                await defeatEffect.runEffect(params);
            }
        }
    }
}