import {MainScenarioCard} from './main-scenario-card.js';

export const CARD_TYPE_MAIN_SCHEME_A_CARD = 'main-scheme-a-card';
export class MainSchemeACard extends MainScenarioCard {
    constructor({
// Card
        name: _name, set: _set, image: _image, ability: _ability, icons: _icons, keywords: _keywords,
// MainScenarioCard
        stage: _stage,
// MainSchemeACard
        content
    }) {
        super(arguments[0]);

        this.content = content;

        this.isMainScheme = true;
        this.isScheme = true;
    }
}