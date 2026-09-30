import {EncounterCard} from './encounter-card.js';
import {MixinSideSchemeCard} from './mixins/mixin-side-scheme-card.js';

export const CARD_TYPE_SIDE_SCHEME_SCENARIO = 'side-scheme-scenario';
export class SideSchemeScenarioCard extends MixinSideSchemeCard(EncounterCard) {}