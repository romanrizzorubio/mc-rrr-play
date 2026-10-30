import {Effect} from './effect.js';
import {
    getScenarioZone,
    getScenarioZoneForCard,
} from '../utils/match-zone-utils.js';

export class AddScenarioVillainEffect extends Effect {
    constructor({name, stage}) {
        super(arguments[0]);

        this.name = name;
        this.stage = stage;
    }
    async execute(params) {
        const zone = getScenarioZoneForCard(this.match, params.card) ??
            getScenarioZoneForCard(this.match, this.ability?.card) ??
            getScenarioZone(this.match, params.player);
        await this.match.scenario.addVillainToZone({
            zone,
            name: this.name,
            stage: this.stage,
            player: params.player,
        });
    }
}
