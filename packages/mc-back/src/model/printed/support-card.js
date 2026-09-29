import {PlayerCard} from "./player-card.js";

export const CARD_TYPE_SUPPORT = 'support';
export class SupportCard extends PlayerCard {
    constructor({
// Card
        name, set, image, traits, ability, unique, icons, keywords,
// PlayerCard
        cost, resources, classification, canPlay
    }) {
        super(arguments[0]);

        this.isSupport = true;
    }
}