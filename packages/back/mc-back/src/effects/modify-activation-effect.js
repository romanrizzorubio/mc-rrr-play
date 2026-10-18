import {Effect} from './effect.js';

export class ModifyActivationEffect extends Effect {
    constructor({
        attack = false,
        scheme = false,
        count = 1,
    }) {
        super(arguments[0]);

        this.attack = attack;
        this.scheme = scheme;
        this.count = count;
    }
    async execute(params) {
        const activationEffect = this.selectedTarget?.effect;
        const modifier = this.paramsCalc ?
            await this.calculate(params) :
            this.count;
        if (!Number.isFinite(modifier)) {
            throw new TypeError('ModifyActivationEffect requires a finite modifier.');
        }
        if (!activationEffect) {
            throw new TypeError('ModifyActivationEffect requires an activation target.');
        }

        let modified = false;
        if (activationEffect.isAttack && this.attack) {
            activationEffect.modifyAttack += modifier;
            modified = true;
        }
        if (activationEffect.isScheme && this.scheme) {
            activationEffect.modifyScheme += modifier;
            modified = true;
        }
        if (!modified) {
            throw new TypeError(
                'ModifyActivationEffect requires a matching attack or scheme modifier.'
            );
        }
    }
}
