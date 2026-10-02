import {TARGET_YOU} from 'mc-shared';

import {EncounterCard} from './encounter-card.js';
import {MixinEnemyCard} from './mixins/mixin-enemy-card.js';


export class MinionCard extends MixinEnemyCard(EncounterCard) {
    constructor({
// Card
        name: _name, set: _set, image: _image, traits: _traits, ability: _ability, unique: _unique, icons: _icons, keywords: _keywords,
// EncounterCard
        boost: _boost, boostAbility: _boostAbility, surge: _surge,
// MixinCharacterCard
        hitPoints: _hitPoints, statusAvailable: _statusAvailable, toughness: _toughness, maxTough: _maxTough,
// MixinEnemyCard
        scheme: _scheme,
// Minion
        faceTo = TARGET_YOU,
        nemesis = false,
    }) {
        super(arguments[0]);

        this.faceTo = faceTo;
        this.nemesis = nemesis;

        this.isMinion = true;
    }
    get guard() {
        return this.keywords.guard;
    }
    get villainous() {
        return this.keywords.villainous;
    }
}