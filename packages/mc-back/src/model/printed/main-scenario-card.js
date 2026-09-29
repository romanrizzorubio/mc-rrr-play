import {EncounterCard} from "./encounter-card.js";

export class MainScenarioCard extends EncounterCard {
    constructor({
// Card
        name, set, image, traits, ability, unique, icons, keywords,
// MainScenarioCard
        stage
    }) {
        super(arguments[0]);

        this.stage = stage;

        this.isMain = true;
    }
    toObj() {
        return {
            ...super.toObj(arguments[0]),
            stage: this.stage
        }
    }
}