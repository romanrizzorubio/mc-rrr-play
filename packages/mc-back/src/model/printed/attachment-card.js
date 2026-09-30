import {EncounterCard} from './encounter-card.js';
import {MixinAttachableCard} from './mixins/mixin-attachable-card.js';

export const CARD_TYPE_ATTACHMENT = 'attachment';
export class AttachmentCard extends MixinAttachableCard(EncounterCard) {
    constructor({
// Card
        name: _name, set: _set, image: _image, traits: _traits, abilities: _abilities, unique: _unique, icons: _icons, keywords: _keywords,
// EncounterCard
        boost: _boost, boostAbility: _boostAbility, surge: _surge,
// AttachableCard
        attach: _attach,
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