import {ACTIVATION_MAP} from './activations-map.js';

export class ActivationsFactory {
    constructor(match) {
        this.match = match;
    }
    createActivation(par = {}) {
        const {type, params = {}, ...rest} = par;
        const         activationParams = {...params, ...rest};

        activationParams.match = this.match;

        const ActivationClass = ACTIVATION_MAP[type];

        if (ActivationClass) {
            return new ActivationClass(activationParams);
        }
    }
}
