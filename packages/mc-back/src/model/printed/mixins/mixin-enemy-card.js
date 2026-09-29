import {MixinCharacterCard} from "./mixin-character-card.js";
import {MixinFrontCard} from "./mixin-front-card.js";

export const MixinEnemyCard = C => class extends MixinFrontCard(MixinCharacterCard(C)) {
    constructor({
// MixinCharacterCard
        hitPoints, statusAvailable, toughness, maxTough = 1,
// MixinEnemyCard
        scheme,
    }) {
        super(arguments[0]);

        this.scheme = scheme;
    }
    toObj() {
        return {
            ...super.toObj(arguments[0])
        }
    }
}
