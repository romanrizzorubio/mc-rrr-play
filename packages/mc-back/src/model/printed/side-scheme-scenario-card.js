import {EncounterCard} from './encounter-card.js';
import {MixinSideSchemeCard} from './mixins/mixin-side-scheme-card.js';

export class SideSchemeScenarioCard extends MixinSideSchemeCard(EncounterCard) {}