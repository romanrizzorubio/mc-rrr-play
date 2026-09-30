import {Card} from './card.js';
import {MixinCharacterCard} from './mixins/mixin-character-card.js';

export class SuperheroCard extends MixinCharacterCard(Card) {
    constructor({
// Card
        name: _name, set: _set, image: _image, traits: _traits, ability: _ability, unique: _unique, icons: _icons, keywords: _keywords,
// MixinCharacterCard
        hitPoints: _hitPoints, maxTough: _maxTough,
// SuperheroCard
        classification,
        handSize,
    }) {
        super(arguments[0]);

        this.classification = classification;
        this.handSize = handSize;

        this.isSuperhero = true;
    }

    toObj() {
        return {
            ...super.toObj(arguments[0])
        };
    }
}