import {Card} from './card.js';

export class EncounterCard extends Card {
    constructor({
// Card
        name: _name, set: _set, image: _image, traits: _traits, ability: _ability, unique: _unique, icons: _icons, keywords: _keywords,
// EncounterCard
        boost = 0,
        boostAbility,
    }) {
        super(arguments[0]);

        this.boost = boost;
        this.boostAbility = boostAbility;

        this.isEncounterCard = true;
        this.isAttachment = false;
        this.isMainScheme = false;
        this.isMinion = false;
        this.isTreachery = false;
        this.isVillain = false;
    }
    async resolveBoost() {
        if (this.boostAbility) {
            await this.boostAbility.resolveAbility();
        }

        return this.boost;
    }
}
