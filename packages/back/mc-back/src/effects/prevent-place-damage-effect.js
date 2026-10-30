import {Effect} from './effect.js';
import {PlaceDamageEffect} from './place-damage-effect.js';
import {PreventDamageEffect} from './prevent-damage-effect.js';

export class PreventPlaceDamageEffect extends Effect {
    constructor({
// PreventPlaceDamageEffect
        damage = 0,
    }) {
        super(arguments[0]);

        this.damage = damage;
    }
    async execute(params) {
        const {damage, selectedTarget} = this;
        const {effect, card} = params;
        const targetIndex = Array.isArray(effect.selectedTarget) ?
            effect.selectedTarget.indexOf(params.triggeredTarget ?? selectedTarget) :
            0;
        if (targetIndex < 0) {
            throw new Error('PreventPlaceDamageEffect could not find the damage target.');
        }
        const previousPrevention = (Array.isArray(effect.preventDamage) ?
            effect.preventDamage[targetIndex] : effect.preventDamage) ?? 0;

        const preventDamageEffect = new PreventDamageEffect({
            selectedTarget,
            damage,
            match: this.match,
        });
        await preventDamageEffect.runEffect(params);

        const prevention = Array.isArray(effect.preventDamage) ?
            effect.preventDamage[targetIndex] : effect.preventDamage;
        const placeDamageEffect = new PlaceDamageEffect({
            damage: prevention - previousPrevention,
            selectedTarget: card,
            match: this.match,
        });
        await placeDamageEffect.runEffect(params);
    }
}