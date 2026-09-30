import {Attack} from '../activations/attack.js';
import {Defense} from '../activations/defense.js';
import {Scheme} from '../activations/scheme.js';
import {Thwart} from '../activations/thwart.js';
import {
    ACTIVATION_ATTACK,
    ACTIVATION_DEFENSE,
    ACTIVATION_SCHEME,
    ACTIVATION_THWART,
} from '../constants/activations.js';

export class ActivationsFactory {
    constructor(match) {
        this.match = match;
    }
    createActivation(par = {}) {
        const {type, params = {}, ...rest} = par;
        const activationParams = {...params, ...rest};

        activationParams.match = this.match;

        switch (type) {
            case ACTIVATION_ATTACK:
                return new Attack(activationParams);
            case ACTIVATION_DEFENSE:
                return new Defense(activationParams);
            case ACTIVATION_SCHEME:
                return new Scheme(activationParams);
            case ACTIVATION_THWART:
                return new Thwart(activationParams);
        }
    }
}
