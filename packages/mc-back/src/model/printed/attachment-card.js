import {EncounterCard} from "./encounter-card.js";
import {MixinAttachableCard} from "./mixins/mixin-attachable-card.js";
import {CHARACTER_VILLAIN} from "../../constants/characters.js";

export const CARD_TYPE_ATTACHMENT = 'attachment';
export class AttachmentCard extends MixinAttachableCard(EncounterCard) {
    constructor({
// Card
        name, set, image, traits, abilities, unique, icons, keywords,
// EncounterCard
        boost, boostAbility, surge,
// AttachableCard
        attach,
// AttachmentCard
        attack,
        scheme
    }) {
        super(arguments[0]);

        this.attack = attack;
        this.scheme = scheme;

        this.isAttachment = true;
    }
}