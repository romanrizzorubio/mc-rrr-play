import {MainScenarioCard} from "./main-scenario-card.js";

export const CARD_TYPE_MAIN_SCHEME_A_CARD = 'main-scheme-a-card';
export class MainSchemeACard extends MainScenarioCard {
    constructor({
// Card
        name, set, image, ability, icons, keywords,
// MainScenarioCard
        stage,
// MainSchemeACard
        content
    }) {
        super(arguments[0]);

        this.content = content;

        this.isMainScheme = true;
        this.isScheme = true;
    }
}