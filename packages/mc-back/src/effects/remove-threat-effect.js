import {Effect} from "./effect.js";
import {DefeatEffect} from "./defeat-effect.js";

export const EFFECT_REMOVE_THREAT = 'remove-threat';
export class RemoveThreatEffect extends Effect {
    constructor({
        threat,
        thwart,
    }) {
        super(arguments[0]);

        this.threat = threat;
        this.thwart = thwart;
    }
    filterTarget(card) {
        return card.canRemoveThreat() &&
            super.filterTarget.apply(this, arguments);
    }
    async prepare(params) {
        await super.prepare(params);

        if (this.threat === undefined) {
            if (this.paramsCalc) {
                this.threat = this.calculate(params);
            } else {
                this.threat = params.threat;
            }
        }
    }
    execute(params) {
        const {selectedTarget, threat} = this;
        const {card} = params;

        selectedTarget.removeThreat(threat);

        selectedTarget.refresh();

        if (selectedTarget.isSideScheme && selectedTarget.threat <= 0) {
            const defeatEffect = new DefeatEffect({
                selectedTarget,
                match: this.match,
                ability: this.ability,
            })
            return defeatEffect.runEffect(params);
        }
    }
}
