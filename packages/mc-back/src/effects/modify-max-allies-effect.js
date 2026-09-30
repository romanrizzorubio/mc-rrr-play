import {Effect} from './effect.js';


export class ModifyMaxAlliesEffect extends Effect {
    constructor({
        count = 0,
    }) {
        super(arguments[0]);
        this.count = count;
    }

    async execute(_params) {
        // En este motor, las capacidades constantes que modifican valores
        // suelen ser recogidas por efectos de cálculo como GetMaxAlliesEffect.
        // Registramos el valor para que sea consultado.
    }
}
