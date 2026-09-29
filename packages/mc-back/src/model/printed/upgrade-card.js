import {PlayerCard} from "./player-card.js";
import {CHARACTER_YOU} from "../../constants/characters.js";
import {MixinAttachableCard} from "./mixins/mixin-attachable-card.js";

export const CARD_TYPE_UPGRADE = 'upgrade';
export class UpgradeCard extends MixinAttachableCard(PlayerCard) {
    constructor({
// Card
        name, set, image, traits, ability, unique, icons, keywords,
// PlayerCard
        cost, resources, classification, canPlay,
// AttachableCard
        attach = CHARACTER_YOU,
    }) {
        super(arguments[0]);

        this.isUpgrade = true;
    }
}