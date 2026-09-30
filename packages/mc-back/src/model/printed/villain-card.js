import {MainScenarioCard} from './main-scenario-card.js';
import {MixinEnemyCard} from './mixins/mixin-enemy-card.js';

export const CARD_TYPE_VILLAIN = 'villain';
export class VillainCard extends MixinEnemyCard(MainScenarioCard) {
    constructor({
// Card
        name: _name, set: _set, image: _image, traits: _traits, ability: _ability, unique: _unique, icons: _icons, keywords: _keywords,
// MainScenarioCard
        stage: _stage,
// MixinCharacterCard
        hitPoints: _hitPoints, statusAvailable: _statusAvailable, toughness: _toughness, maxTough: _maxTough,
// MixinEnemyCard
        scheme: _scheme,
    }) {
        super(arguments[0]);

        this.isVillain = true;
    }
    toObj() {
        return {
            ...super.toObj(arguments[0])
        };
    }
}