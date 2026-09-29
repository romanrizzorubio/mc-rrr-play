import {Card} from "./card.js";
import {MixinCharacterCard} from "./mixins/mixin-character-card.js";
export class SuperheroCard extends MixinCharacterCard(Card) {
    constructor({
// Card
        name, set, image, traits, ability, unique, icons, keywords,
// MixinCharacterCard
        hitPoints, maxTough,
// SuperheroCard
        classification,
        handSize,
    }) {
        super(arguments[0]);

        this.classification = classification;
        this.handSize = handSize;

        this.isSuperhero = true;
    }

    toObj() {
        return {
            ...super.toObj(arguments[0])
        }
    }
}