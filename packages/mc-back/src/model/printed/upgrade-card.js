import {CHARACTER_YOU} from 'mc-shared';

import {MixinAttachableCard} from './mixins/mixin-attachable-card.js';
import {PlayerCard} from './player-card.js';


export class UpgradeCard extends MixinAttachableCard(PlayerCard) {
    constructor({
// Card
        name: _name, set: _set, image: _image, traits: _traits, ability: _ability, unique: _unique, icons: _icons, keywords: _keywords,
// PlayerCard
        cost: _cost, resources: _resources, classification: _classification, canPlay: _canPlay,
// AttachableCard
        attach: _attach = CHARACTER_YOU,
    }) {
        super(arguments[0]);

        this.isUpgrade = true;
    }
}