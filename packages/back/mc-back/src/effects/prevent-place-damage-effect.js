import {Effect} from './effect.js';
import {PlaceDamageEffect} from './place-damage-effect.js';
import {PreventDamageEffect} from './prevent-damage-effect.js';

export class PreventPlaceDamageEffect extends Effect {
    constructor({
// PreventPlaceDamageEffect
        damage = 0,
        preventAll = false,
    }) {
        super(arguments[0]);

        this.damage = damage;
        this.preventAll = preventAll;
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
        const incomingDamage = Array.isArray(effect.damage) ?
            effect.damage[targetIndex] : effect.damage;

        const preventDamageEffect = new PreventDamageEffect({
            selectedTarget,
            damage,
            preventAll: this.preventAll,
            paramsCalc: this.paramsCalc,
            paramsLastStep: this.paramsLastStep,
            match: this.match,
        });
        await preventDamageEffect.runEffect(params);

        const prevention = Array.isArray(effect.preventDamage) ?
            effect.preventDamage[targetIndex] : effect.preventDamage;
        const preventedDamage = Math.max(0,
            Math.min(incomingDamage, prevention) -
            Math.min(incomingDamage, previousPrevention));
        if (preventedDamage === 0) {
            return;
        }
        const placeDamageEffect = new PlaceDamageEffect({
            damage: preventedDamage,
            selectedTarget: card,
            match: this.match,
        });
        await placeDamageEffect.runEffect(params);
    }
}