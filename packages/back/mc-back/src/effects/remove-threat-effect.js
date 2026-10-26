import {EFFECT_REMOVE_THREAT} from 'mc-shared';
import {removeThreatTokens} from '../utils/token-mutations.js';
import {defeatSideSchemeIfEmpty} from '../utils/scheme-threat-resolution.js';
import {Effect} from './effect.js';

export class RemoveThreatEffect extends Effect {
    constructor({
        ignoreCrisis = false,
        threat,
        thwart,
    }) {
        super({
            ...arguments[0],
            effectType: EFFECT_REMOVE_THREAT,
        });

        this.baseThreat = threat;
        this.threat = threat;
        this.threatModifier = 0;
        this.thwart = thwart;
        this.ignoreCrisis = ignoreCrisis;
    }
    filterTarget(card) {
        return card.canRemoveThreat({ignoreCrisis: this.ignoreCrisis}) &&
            super.filterTarget.apply(this, arguments);
    }
    async prepare(params) {
        await super.prepare(params);

        const lastStepThreat = this.getLastStepParam('threat', params);
        if (lastStepThreat !== undefined) {
            this.threat = lastStepThreat;
        } else if (this.paramsCalc) {
            this.threat = this.calculate(params);
        } else {
            this.threat = this.calcPerPlayer(this.baseThreat ?? params.threat);
        }
        if (Number.isFinite(this.threat)) {
            this.threat += this.threatModifier;
        } else if (this.threatModifier) {
            throw new TypeError('RemoveThreatEffect requires a numeric threat value to modify.');
        }
    }
    async execute(params) {
        const {selectedTarget, threat} = this;

        if (Array.isArray(selectedTarget)) {
            return this.promisesSequential(selectedTarget, selectedTarget => {
                const effect = new RemoveThreatEffect({
                    selectedTarget,
                    threat,
                    match: this.match,
                    ability: this.ability,
                });
                return effect.runEffect(params);
            });
        }

        removeThreatTokens(selectedTarget, threat);

        selectedTarget.refresh();

        return defeatSideSchemeIfEmpty(
            selectedTarget,
            this.match,
            this.ability,
            params
        );
    }
}
