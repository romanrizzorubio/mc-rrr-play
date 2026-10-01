import {CharacterGameCard} from '../../model/cards/character-game-card.js';
import {GameCard} from '../../model/cards/game-card.js';
import {SchemeGameCard} from '../../model/cards/scheme-game-card.js';
import {AbilitiesFactory} from '../abilities/abilities-factory.js';
import {CARD_MAP} from './cards-map.js';

export class CardsFactory {
    constructor(matchFactory) {
        this.matchFactory = matchFactory;

        this.abilitiesFactory = new AbilitiesFactory(this);
    }
    get match() {
        return this.matchFactory.match;
    }
    createCard({type, params}) {
        params.match = this.match;

        if (Object.hasOwn(CARD_MAP, type)) {
            return new CARD_MAP[type](params);
        }
    }
    createCardSides(sides) {
        return new GameCard({
            sides,
            match: this.match,
        });
    }
    createGameCard({card, index, owner}) {
        if (card instanceof Array) {
            return card.map((card, index) => this.createGameCard({card, index, owner}));
        } else {
            const abilities = card.abilities.map(ability => {
                return this.abilitiesFactory.createAbility(ability);
            });

            const boostAbility = card.boostAbility && this.abilitiesFactory.createAbility(card.boostAbility);

            if (card.isScheme) {
                return new SchemeGameCard({card, index, owner, abilities, boostAbility});
            } else if (card.isCharacter) {
                return new CharacterGameCard({card, index, owner, abilities, boostAbility});
            }

            return new GameCard({card, index, owner, abilities, boostAbility});
        }
    }
    createSides(sides) {
        return sides.map(cardConfig => {
            const card = this.createCard(cardConfig);

            return this.createGameCard({card});
        });
    };
}
