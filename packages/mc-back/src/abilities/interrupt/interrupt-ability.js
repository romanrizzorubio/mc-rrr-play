import {Ability} from "../core/ability.js";
import {PRIORITY_INTERRUPT} from "../../constants/priorities.js";
import {MixinTriggeableAbility} from "../mixins/mixin-triggeable-ability.js";
import {TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE} from "../../triggers/attached-would-dealt-damage-trigger.js";
import {TRIGGER_VILLAIN_ATTACKS_YOU} from "../../triggers/villain-attacks-you-trigger.js";
import {TRIGGER_VILLAIN_SCHEMES} from "../../triggers/villain-schemes-trigger.js";
import {TRIGGER_YOU_WOULD_TAKE_DAMAGE} from "../../triggers/you-would-take-damage-trigger.js";

export const ABILITY_INTERRUPT = 'interrupt';
export class InterruptAbility extends MixinTriggeableAbility(Ability) {
    getTitle(params) {
        const {
            effect,
        } = params;

        switch (this.trigger) {
            case TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE:
                return `${effect.selectedTarget.name} va a sufrir ${effect.damage} de Daño.`;
            case TRIGGER_VILLAIN_ATTACKS_YOU:
                return `${effect.character.name} te va a atacar.`;
            case TRIGGER_VILLAIN_SCHEMES:
                return `${effect.character.name} va a ejecutar el Plan.`;
            case TRIGGER_YOU_WOULD_TAKE_DAMAGE:
                return `Vas a sufrir ${effect.damage} de Daño.`;
            default:
                return super.getTitle();
        }
    }
    initTriggers(card) {
        this.initTrigger({
            type: this.trigger,
            priority: PRIORITY_INTERRUPT,
            ability: this,
            card
        });
    }
}