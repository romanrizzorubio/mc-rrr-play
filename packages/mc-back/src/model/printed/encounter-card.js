import {Card} from "./card.js";
import {WhenRevealedAbility} from "../../abilities/when/when-revealed-ability.js";

export class EncounterCard extends Card {
    constructor({
// Card
        name, set, image, traits, ability, unique, icons, keywords,
// EncounterCard
        boost = 0,
        boostAbility,
    }) {
        super(arguments[0]);

        this.boost = boost;
        this.boostAbility = boostAbility;

        this.isEncounterCard = true;
        this.isAttachment = false;
        this.isMainScheme = false;
        this.isMinion = false;
        this.isTreachery = false;
        this.isVillain = false;
    }
    async resolveBoost() {
        if (this.boostAbility) {
            await this.boostAbility.resolveAbility()
        }

        return this.boost;
    }
}
