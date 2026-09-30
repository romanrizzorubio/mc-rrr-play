import {EnemyActivationEffect} from './enemy-activation-effect.js';
import {GetSchemeEffect} from './get-scheme-effect.js';
import {PlaceThreatEffect} from './place-threat-effect.js';

export class EnemySchemeEffect extends EnemyActivationEffect {
    constructor() {
        super({
            ...arguments[0],
            isScheme: true,
        });

        this.preventThreat = 0;
    }
    getTargetDialog() {
        const {selectedTarget} = this;

        return selectedTarget;
    }
    async getSchemeValue(params) {
        const {character} = this;

        const getSchemeEffect = new GetSchemeEffect({
            selectedTarget: character,
            match: this.match,
        });

        await getSchemeEffect.runEffect(params);

        return getSchemeEffect.scheme;
    }
    getTitleDialog() {
        const {character} = this;

        return `${character.name} ejecuta el Plan`;
    }
    async execute(params) {
        const {preventThreat} = this;

        await this.dealBoostCards(params);
        const boost = await this.resolveBoostCards(params);
        const schValue = await this.getSchemeValue(params);
        let threat = schValue + boost - preventThreat;
        if (threat < 0) {
            threat = 0;
        }

        const placeThreatEffect = new PlaceThreatEffect({
            threat,
            isScheme: true,
            match: this.match,
            selectedTarget: this.selectedTarget,
            activation: this.activation,
            ability: this.ability,
        });

        await placeThreatEffect.runEffect(params);
    }
}