import {PlayerCard} from './player-card.js';

export class SupportCard extends PlayerCard {
    constructor({
// Card
        name: _name, set: _set, image: _image, traits: _traits, ability: _ability, unique: _unique, icons: _icons, keywords: _keywords,
// PlayerCard
        cost: _cost, resources: _resources, classification: _classification, canPlay: _canPlay
    }) {
        super(arguments[0]);

        this.isSupport = true;
    }
}