import {Effect} from "./effect.js";
import {TARGET_SCHEME} from "../constants/targets.js";
import {DefeatEffect} from "./defeat-effect.js";
import {TRIGGER_PLACE_THREAT} from "../triggers/place-threat-trigger.js";

export const EFFECT_PLACE_THREAT = 'place-threat';
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
                TRIGGER_PLACE_THREAT,
            ]);
    }
    getThreat(params) {
        const {paramsCalc} = this;

        return paramsCalc ?
            this.calculate(params) :
            this.threat;
    }
    getTitle() {
        return `Colocas ${this.threat} de Amenaza en el Plan principal.`
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
                const defeatEffect = new DefeatEffect({
                    selectedTarget,
                    match: this.match,
                });

                await defeatEffect.runEffect(params);
            }
        }
    }
}