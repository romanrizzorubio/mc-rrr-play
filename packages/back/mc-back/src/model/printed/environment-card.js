import {EncounterCard} from './encounter-card.js';

export class EnvironmentCard extends EncounterCard {
    constructor() {
        super(arguments[0]);

        this.isEnvironment = true;
    }
}
