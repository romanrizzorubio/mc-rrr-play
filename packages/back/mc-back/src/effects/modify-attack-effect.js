import {Effect} from './effect.js';

export class ModifyAttackEffect extends Effect {
    constructor({
        modify
    }) {
        super(arguments[0]);

        this.modify = modify;
    }
    execute(params) {
        const {selectedTarget} = this;
        const target = selectedTarget?.effect?.isAttack ?
            selectedTarget.effect :
            selectedTarget;

        Object.entries(this.modify).forEach(([key, value]) => {
            if (key === 'keywords' &&
                value && typeof value === 'object' && !Array.isArray(value) &&
                target.keywords && typeof target.keywords === 'object') {
                const isLasting = Boolean(params.lasting);
                const source = params.lasting ??
                    this.ability?.card ??
                    this.source;
                const dynamicModifierAdded = target.isAttack &&
                    typeof target.addAttackKeywordModifier === 'function' &&
                    target.addAttackKeywordModifier(
                        source,
                        this.ability,
                        value,
                        isLasting
                    );
                if (!dynamicModifierAdded) {
                    Object.assign(target.keywords, value);
                }
                return;
            }

            target[key] = value;
        });
    }
}