import {Trigger} from './base/trigger.js';
import {MixinCharacterVillainTrigger} from './mixins/mixin-character-villain-trigger.js';

export class VillainSchemesTrigger extends MixinCharacterVillainTrigger(Trigger) {
    getInterruptName(params) {
        return `${this.getVillain(params).name} va a ejecutar el Plan.`;
    }
}