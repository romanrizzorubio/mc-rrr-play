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

        const preventDamageEffect = new PreventDamageEffect({
            selectedTarget,
            damage,
            match: this.match,
        });
        await preventDamageEffect.runEffect(params);

        const placeDamageEffect = new PlaceDamageEffect({
            damage: effect.preventDamage,
            selectedTarget: card,
            match: this.match,
        });
        await placeDamageEffect.runEffect(params);
    }
}