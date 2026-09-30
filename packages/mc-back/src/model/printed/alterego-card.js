import {SuperheroCard} from './superhero-card.js';

export const CARD_TYPE_ALTEREGO = 'alter-ego';
export class AlterEgoCard extends SuperheroCard {
    constructor({
// Card
        name: _name, set: _set, image: _image, traits: _traits, abilities: _abilities, unique: _unique, icons: _icons, keywords: _keywords,
// MixinCharacterCard
        hitPoints: _hitPoints, maxTough: _maxTough,
// SuperheroCard
        classification: _classification, handSize: _handSize,
// AlterEgoCard
        recovery,
    }) {
        super(arguments[0]);

        this.recovery = recovery;

        this.isAlterEgo = true;
    }

    toObj() {
        return {
            ...super.toObj(arguments[0])
        };
    }
}