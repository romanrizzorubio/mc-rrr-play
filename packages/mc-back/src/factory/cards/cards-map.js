import {
    CARD_TYPE_ALLY,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_EVENT,
    CARD_TYPE_ENVIRONMENT,
    CARD_TYPE_HERO,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_SUPERHERO,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CARD_TYPE_VILLAIN,
} from 'mc-shared';
import {Superhero} from '../../model/match/superhero.js';
import {AllyCard} from '../../model/printed/ally-card.js';
import {AlterEgoCard} from '../../model/printed/alterego-card.js';
import {AttachmentCard} from '../../model/printed/attachment-card.js';
import {EventCard} from '../../model/printed/event-card.js';
import {EnvironmentCard} from '../../model/printed/environment-card.js';
import {HeroCard} from '../../model/printed/hero-card.js';
import {MainSchemeACard} from '../../model/printed/main-scheme-a-card.js';
import {MainSchemeBCard} from '../../model/printed/main-scheme-b-card.js';
import {MinionCard} from '../../model/printed/minion-card.js';
import {ObligationCard} from '../../model/printed/obligation-card.js';
import {ResourceCard} from '../../model/printed/resource-card.js';
import {SideSchemeScenarioCard} from '../../model/printed/side-scheme-scenario-card.js';
import {SupportCard} from '../../model/printed/support-card.js';
import {TreacheryCard} from '../../model/printed/treachery-card.js';
import {UpgradeCard} from '../../model/printed/upgrade-card.js';
import {VillainCard} from '../../model/printed/villain-card.js';

export const CARD_MAP = {
    [CARD_TYPE_ALLY]: AllyCard,
    [CARD_TYPE_ALTEREGO]: AlterEgoCard,
    [CARD_TYPE_ATTACHMENT]: AttachmentCard,
    [CARD_TYPE_EVENT]: EventCard,
    [CARD_TYPE_ENVIRONMENT]: EnvironmentCard,
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
