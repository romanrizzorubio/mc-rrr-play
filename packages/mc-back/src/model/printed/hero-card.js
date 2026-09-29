import {SuperheroCard} from "./superhero-card.js";
import {MixinFriendFrontCard} from "./mixins/mixin-friend-front-card.js";

export const CARD_TYPE_HERO = 'hero';
export class HeroCard extends MixinFriendFrontCard(SuperheroCard) {
    constructor({
// Card
        name, set, image, traits, ability, unique, icons, keywords,
// SuperheroCard
        classification, handSize,
// FrontCard
        attack,
// FriendFrontCard
        thwart,
// HeroCard
        defense,
    }) {
        super(arguments[0]);

        this.defense = defense;

        this.isHero = true;
    }
}