import {MixinEnemyCard} from "./mixins/mixin-enemy-card.js";
import {MainScenarioCard} from "./main-scenario-card.js";

export const CARD_TYPE_VILLAIN = 'villain';
export class VillainCard extends MixinEnemyCard(MainScenarioCard) {
    constructor({
// Card
        name, set, image, traits, ability, unique, icons, keywords,
// MainScenarioCard
        stage,
// MixinCharacterCard
        hitPoints, statusAvailable, toughness, maxTough,
// MixinEnemyCard
        scheme,
    }) {
        super(arguments[0]);

        this.isVillain = true;
    }
    toObj() {
        return {
            ...super.toObj(arguments[0])
        }
    }
}