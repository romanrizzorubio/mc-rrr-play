import {MixinFriendFrontCard} from './mixins/mixin-friend-front-card.js';
import {SuperheroCard} from './superhero-card.js';

export class HeroCard extends MixinFriendFrontCard(SuperheroCard) {
    constructor({
// Card
        name: _name, set: _set, image: _image, traits: _traits, ability: _ability, unique: _unique, icons: _icons, keywords: _keywords,
// SuperheroCard
        classification: _classification, handSize: _handSize,
// FrontCard
        attack: _attack,
// FriendFrontCard
        thwart: _thwart,
// HeroCard
        defense,
    }) {
        super(arguments[0]);

        this.defense = defense;

        this.isHero = true;
    }
}