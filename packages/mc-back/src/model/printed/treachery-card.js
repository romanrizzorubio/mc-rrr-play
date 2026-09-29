import {EncounterCard} from "./encounter-card.js";

export const CARD_TYPE_TREACHERY = 'treachery';
export class TreacheryCard extends EncounterCard {
    constructor({
// Card
        name, set, image, traits, ability, unique, icons, keywords,
// EncounterCard
        boost, boostAbility, surge
    }) {
        super(arguments[0]);

        this.isTreachery = true;
    }
}