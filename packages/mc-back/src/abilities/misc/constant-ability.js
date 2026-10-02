import {
    EFFECT_ADD_TRAIT,
    EFFECT_CHAINED,
    EFFECT_SURGE,
    EFFECT_TOUGH,
} from '../../constants/effects.js';
import {PRIORITY_CONSTANT} from '../../constants/priorities.js';
import {Ability} from '../core/ability.js';
import {MixinTriggeableAbility} from '../mixins/mixin-triggeable-ability.js';

function isAutomaticConstantEffect(effect) {
    if (!effect) {
        return false;
    }

    const {effectType, effects = [], effectNot} = effect;
    const hasKeyword = Object.entries(effect.keywords || {})
        .some(([key, value]) => key !== 'triggers' && key !== '_hint' && Boolean(value));
    if (effectType?.startsWith('modify-') ||
        effectType === EFFECT_ADD_TRAIT ||
        effectType === EFFECT_SURGE ||
        effectType === EFFECT_TOUGH ||
        hasKeyword) {
        return true;
    }

    if (effectType === EFFECT_CHAINED) {
        return effects.length > 0 && effects.every(isAutomaticConstantEffect);
    }

    const branches = [effect.effect, effectNot].filter(Boolean);
    return branches.length > 0 && branches.every(isAutomaticConstantEffect);
}

export class ConstantAbility extends MixinTriggeableAbility(Ability) {
    constructor({
        once,
    }) {
        super(arguments[0]);

        this.once = once;
        this.hideDialog = this.hideDialog || isAutomaticConstantEffect(this.effect);
    }
    initTriggers(card, _params) {
        this.initTrigger({
            type: this.trigger,
            priority: PRIORITY_CONSTANT,
            ability: this,
            card
        });
    }
    async resolveAbility(params) {
        await super.resolveAbility(params);

        if (this.once && this.card) {
            this.card.endTriggers();
        }
    }
}