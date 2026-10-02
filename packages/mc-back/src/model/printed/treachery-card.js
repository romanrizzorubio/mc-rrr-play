import {EncounterCard} from './encounter-card.js';

export class TreacheryCard extends EncounterCard {
    constructor({
// Card
        name: _name, set: _set, image: _image, traits: _traits, ability: _ability, unique: _unique, icons: _icons, keywords: _keywords,
// EncounterCard
        boost: _boost, boostAbility: _boostAbility, surge: _surge
    }) {
        super(arguments[0]);

        this.isTreachery = true;
    }
}