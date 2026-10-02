import {PRIORITY_INTERRUPT,
    TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE,
    TRIGGER_VILLAIN_ATTACKS_YOU,
    TRIGGER_VILLAIN_SCHEMES,
    TRIGGER_YOU_WOULD_TAKE_DAMAGE
} from 'mc-shared';
import {Ability} from '../core/ability.js';
import {MixinTriggeableAbility} from '../mixins/mixin-triggeable-ability.js';

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