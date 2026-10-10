import {EncounterCard} from './encounter-card.js';

export class ObligationCard extends EncounterCard {
    constructor({
// Card
        name: _name, set: _set, image: _image, traits: _traits, ability: _ability, unique: _unique, icons: _icons, keywords: _keywords,
// EncounterCard
        boost: _boost, boostAbility: _boostAbility, surge: _surge,
// ObligationCard
        giveToOwner = false,
    }) {
        super(arguments[0]);

        this.giveToOwner = giveToOwner;

        this.isObligation = true;
    }
}