import {SuperheroCard} from "./superhero-card.js";
import {RecoveryBasicAbility} from "../../abilities/basic/recovery-basic-ability.js";

export const CARD_TYPE_ALTEREGO = 'alter-ego';
export class AlterEgoCard extends SuperheroCard {
    constructor({
// Card
        name, set, image, traits, abilities, unique, icons, keywords,
// MixinCharacterCard
        hitPoints, maxTough,
// SuperheroCard
        classification, handSize,
// AlterEgoCard
        recovery,
    }) {
        super(arguments[0]);

        this.recovery = recovery;

        this.isAlterEgo = true;
    }

    toObj() {
        return {
            ...super.toObj(arguments[0])
        }
    }
}