import {EncounterCard} from './encounter-card.js';

export class MainScenarioCard extends EncounterCard {
    constructor({
// Card
        name: _name, set: _set, image: _image, traits: _traits, ability: _ability, unique: _unique, icons: _icons, keywords: _keywords,
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
            stage: this.stage,
            isMainScheme: Boolean(this.isMainScheme),
        };
    }
}