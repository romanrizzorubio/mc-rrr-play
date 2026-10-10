import {MainScenarioCard} from './main-scenario-card.js';

export class MainSchemeBCard extends MainScenarioCard {
    constructor({
// Card
        name: _name, set: _set, image: _image, traits: _traits, ability: _ability, icons: _icons, keywords: _keywords,
// MainScenarioCard
        stage: _stage,
// MainSchemeBCard
        value,
        startingThreat,
        acceleration,
        final = false
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
        };
    }
}