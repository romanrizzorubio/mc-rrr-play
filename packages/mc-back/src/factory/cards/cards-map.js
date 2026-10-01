import {CARD_TYPE_SUPERHERO, Superhero} from '../../model/match/superhero.js';
import {AllyCard, CARD_TYPE_ALLY} from '../../model/printed/ally-card.js';
import {AlterEgoCard, CARD_TYPE_ALTEREGO} from '../../model/printed/alterego-card.js';
import {AttachmentCard, CARD_TYPE_ATTACHMENT} from '../../model/printed/attachment-card.js';
import {CARD_TYPE_EVENT, EventCard} from '../../model/printed/event-card.js';
import {CARD_TYPE_HERO, HeroCard} from '../../model/printed/hero-card.js';
import {CARD_TYPE_MAIN_SCHEME_A_CARD, MainSchemeACard} from '../../model/printed/main-scheme-a-card.js';
import {CARD_TYPE_MAIN_SCHEME_B_CARD, MainSchemeBCard} from '../../model/printed/main-scheme-b-card.js';
import {CARD_TYPE_MINION, MinionCard} from '../../model/printed/minion-card.js';
import {CARD_TYPE_OBLIGATION, ObligationCard} from '../../model/printed/obligation-card.js';
import {CARD_TYPE_RESOURCE, ResourceCard} from '../../model/printed/resource-card.js';
import {CARD_TYPE_SIDE_SCHEME_SCENARIO, SideSchemeScenarioCard} from '../../model/printed/side-scheme-scenario-card.js';
import {CARD_TYPE_SUPPORT, SupportCard} from '../../model/printed/support-card.js';
import {CARD_TYPE_TREACHERY, TreacheryCard} from '../../model/printed/treachery-card.js';
import {CARD_TYPE_UPGRADE, UpgradeCard} from '../../model/printed/upgrade-card.js';
import {CARD_TYPE_VILLAIN, VillainCard} from '../../model/printed/villain-card.js';

export const CARD_MAP = {
    [CARD_TYPE_ALLY]: AllyCard,
    [CARD_TYPE_ALTEREGO]: AlterEgoCard,
    [CARD_TYPE_ATTACHMENT]: AttachmentCard,
    [CARD_TYPE_EVENT]: EventCard,
    [CARD_TYPE_HERO]: HeroCard,
    [CARD_TYPE_MAIN_SCHEME_A_CARD]: MainSchemeACard,
    [CARD_TYPE_MAIN_SCHEME_B_CARD]: MainSchemeBCard,
    [CARD_TYPE_MINION]: MinionCard,
    [CARD_TYPE_OBLIGATION]: ObligationCard,
    [CARD_TYPE_RESOURCE]: ResourceCard,
    [CARD_TYPE_SIDE_SCHEME_SCENARIO]: SideSchemeScenarioCard,
    [CARD_TYPE_SUPERHERO]: Superhero,
    [CARD_TYPE_SUPPORT]: SupportCard,
    [CARD_TYPE_TREACHERY]: TreacheryCard,
    [CARD_TYPE_UPGRADE]: UpgradeCard,
    [CARD_TYPE_VILLAIN]: VillainCard,
};
