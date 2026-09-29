import {MixinEnemyCard} from "./mixins/mixin-enemy-card.js";
import {EncounterCard} from "./encounter-card.js";
import {TARGET_YOU} from "../../constants/targets.js";

export const CARD_TYPE_MINION = 'minion';
export class MinionCard extends MixinEnemyCard(EncounterCard) {
    constructor({
// Card
        name, set, image, traits, ability, unique, icons, keywords,
// EncounterCard
        boost, boostAbility, surge,
// MixinCharacterCard
        hitPoints, statusAvailable, toughness, maxTough,
// MixinEnemyCard
        scheme,
// Minion
        faceTo = TARGET_YOU,
        nemesis = false,
    }) {
        super(arguments[0]);

        this.faceTo = faceTo;
        this.nemesis = nemesis;

        this.isMinion = true;
    }
    get guard() {
        return this.keywords.guard;
    }
    get villainous() {
        return this.keywords.villainous;
    }
}