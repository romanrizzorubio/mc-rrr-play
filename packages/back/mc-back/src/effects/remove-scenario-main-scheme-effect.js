import {Effect} from './effect.js';
import {
    getScenarioZone,
    getScenarioZoneForCard,
} from '../utils/match-zone-utils.js';

export class RemoveScenarioMainSchemeEffect extends Effect {
    async execute(params) {
        const zone = getScenarioZoneForCard(this.match, params.card) ??
            getScenarioZoneForCard(this.match, this.ability?.card) ??
            getScenarioZone(this.match, params.player);
        const scheme = zone?.currentScheme;
        if (!scheme) {
            return;
        }

        scheme.endTriggers(true);
        await scheme.currentSide.removeAttached();
        this.match.removeCard(scheme);
        zone.currentScheme = null;
        await zone.refresh();
    }
}
