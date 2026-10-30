import {Effect} from './effect.js';
import {
    getScenarioZone,
    getScenarioZoneForCard,
} from '../utils/match-zone-utils.js';

export class AdvanceMainSchemeStageEffect extends Effect {
    constructor({stage}) {
        super(arguments[0]);

        this.stage = stage;
    }
    async execute(params) {
        const zone = getScenarioZoneForCard(this.match, params.card) ??
            getScenarioZoneForCard(this.match, this.ability?.card) ??
            getScenarioZone(this.match, params.player);
        await this.match.scenario.advanceMainScheme(
            zone,
            this.stage,
            params.player,
        );
    }
}
