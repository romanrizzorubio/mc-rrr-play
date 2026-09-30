import {CharacterGameCard} from '../model/cards/character-game-card.js';
import {GameCard} from '../model/cards/game-card.js';
import {SchemeGameCard} from '../model/cards/scheme-game-card.js';
import {CARD_TYPE_SUPERHERO, Superhero} from '../model/match/superhero.js';
import {AllyCard, CARD_TYPE_ALLY} from '../model/printed/ally-card.js';
import {AlterEgoCard, CARD_TYPE_ALTEREGO} from '../model/printed/alterego-card.js';
import {AttachmentCard, CARD_TYPE_ATTACHMENT} from '../model/printed/attachment-card.js';
import {CARD_TYPE_EVENT, EventCard} from '../model/printed/event-card.js';
import {CARD_TYPE_HERO, HeroCard} from '../model/printed/hero-card.js';
import {CARD_TYPE_MAIN_SCHEME_A_CARD, MainSchemeACard} from '../model/printed/main-scheme-a-card.js';
import {CARD_TYPE_MAIN_SCHEME_B_CARD, MainSchemeBCard} from '../model/printed/main-scheme-b-card.js';
import {CARD_TYPE_MINION, MinionCard} from '../model/printed/minion-card.js';
import {CARD_TYPE_OBLIGATION, ObligationCard} from '../model/printed/obligation-card.js';
import {CARD_TYPE_RESOURCE, ResourceCard} from '../model/printed/resource-card.js';
import {CARD_TYPE_SIDE_SCHEME_SCENARIO, SideSchemeScenarioCard} from '../model/printed/side-scheme-scenario-card.js';
import {CARD_TYPE_SUPPORT, SupportCard} from '../model/printed/support-card.js';
import {CARD_TYPE_TREACHERY, TreacheryCard} from '../model/printed/treachery-card.js';
import {CARD_TYPE_UPGRADE, UpgradeCard} from '../model/printed/upgrade-card.js';
import {CARD_TYPE_VILLAIN, VillainCard} from '../model/printed/villain-card.js';

import {AbilitiesFactory} from './abilities-factory.js';

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

        switch(type) {
            case CARD_TYPE_ALLY:
                return new AllyCard(params);
            case CARD_TYPE_ALTEREGO:
                return new AlterEgoCard(params);
            case CARD_TYPE_ATTACHMENT:
                return new AttachmentCard(params);
            case CARD_TYPE_EVENT:
                return new EventCard(params);
            case CARD_TYPE_HERO:
                return new HeroCard(params);
            case CARD_TYPE_MAIN_SCHEME_A_CARD:
                return new MainSchemeACard(params);
            case CARD_TYPE_MAIN_SCHEME_B_CARD:
                return new MainSchemeBCard(params);
            case CARD_TYPE_MINION:
                return new MinionCard(params);
            case CARD_TYPE_OBLIGATION:
                return new ObligationCard(params);
            case CARD_TYPE_RESOURCE:
                return new ResourceCard(params);
            case CARD_TYPE_SIDE_SCHEME_SCENARIO:
                return new SideSchemeScenarioCard(params);
            case CARD_TYPE_SUPERHERO:
                return new Superhero(params);
            case CARD_TYPE_SUPPORT:
                return new SupportCard(params);
            case CARD_TYPE_TREACHERY:
                return new TreacheryCard(params);
            case CARD_TYPE_UPGRADE:
                return new UpgradeCard(params);
            case CARD_TYPE_VILLAIN:
                return new VillainCard(params);
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
