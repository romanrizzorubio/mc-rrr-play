import {EncounterCard} from "./encounter-card.js";

export const CARD_TYPE_OBLIGATION = 'obligation';
export class ObligationCard extends EncounterCard {
    constructor({
// Card
        name, set, image, traits, ability, unique, icons, keywords,
// EncounterCard
        boost, boostAbility, surge,
// ObligationCard
        giveToOwner = false,
    }) {
        super(arguments[0]);

        this.giveToOwner = giveToOwner;

        this.isObligation = true;
    }
}