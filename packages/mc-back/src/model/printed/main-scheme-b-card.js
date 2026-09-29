import {MainScenarioCard} from "./main-scenario-card.js";

export const CARD_TYPE_MAIN_SCHEME_B_CARD = 'main-scheme-b-card';
export class MainSchemeBCard extends MainScenarioCard {
    constructor({
// Card
        name, set, image, traits, ability, icons, keywords,
// MainScenarioCard
        stage,
// MainSchemeBCard
        value,
        startingThreat,
        acceleration,
        final = true
    }) {
        super(arguments[0]);

        this.startingThreat = startingThreat;
        this.final = final;
        this._acceleration = acceleration;
        this._value = value;

        this.isMainScheme = true;
        this.isScheme = true;
    }
    get acceleration() {
        return this.calcPerPlayer(this._acceleration);
    }
    get initial() {
        return this.calcPerPlayer(this.startingThreat);
    }
    get value() {
        return this.calcPerPlayer(this._value);
    }
    toObj() {
        const {value} = this;

        return {
            ...super.toObj(arguments[0]),
            value,
        }
    }
}