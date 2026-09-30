import {Effect} from './effect.js';
import {RemoveThreatEffect} from './remove-threat-effect.js';

export class RemoveThreatAllSchemesEffect extends Effect {
    constructor({
        threat,
    }) {
        super(arguments[0]);

        this.threat = threat;
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
    async execute(params) {
        const {threat} = this;
        const {match} = params;

        const schemes = match.scenario.gameZone.cards.filter(card => card.isScheme);
        
        await this.promisesSequential(schemes, async selectedTarget => {
             const effect = new RemoveThreatEffect({
                selectedTarget,
                threat,
                match: this.match,
                ability: this.ability,
            });
            await effect.runEffect(params);
        });
    }
}
