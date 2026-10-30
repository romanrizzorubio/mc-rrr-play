import {Effect} from './effect.js';
import {
    getScenarioZone,
    getScenarioZoneForCard,
} from '../utils/match-zone-utils.js';

export class MergeScenarioZoneEffect extends Effect {
    async execute(params) {
        const zone = getScenarioZoneForCard(this.match, params.card) ??
            getScenarioZoneForCard(this.match, this.ability?.card) ??
            getScenarioZone(this.match, params.player);
        await this.match.scenario.mergeZone(zone);
    }
}
