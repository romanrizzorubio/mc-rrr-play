import {TRIGGER_WOULD_ADD_ACCELERATION_TOKEN} from 'mc-shared';

import {Effect} from './effect.js';

export class AddAccelerationTokenEffect extends Effect {
    constructor({
        count = 1,
        countFromEffect = false,
    }) {
        super(arguments[0]);

        this.count = count;
        this.countFromEffect = countFromEffect;
        this.canceled = false;
    }
    cancel() {
        this.canceled = true;
    }
    checkTrigger() {
        return !this.canceled;
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.canceled = false;
    }
    getTriggersWould() {
        return super.getTriggersWould()
            .concat([TRIGGER_WOULD_ADD_ACCELERATION_TOKEN]);
    }
    getCount(params) {
        if (this.countFromEffect) {
            const triggeredEffect = params.triggeredEffect;
            if (typeof triggeredEffect?.getCount !== 'function') {
                throw new Error(
                    'No se pudo determinar la cantidad de fichas de Aceleración que se iba a colocar.'
                );
            }

            return triggeredEffect.getCount(params);
        }

        return this.paramsCalc ?
            this.calculate(params) :
            this.count;
    }
    async execute(params) {
        const {selectedTarget} = this;
        const count = this.getCount(params);

        if (typeof selectedTarget?.addAccelerationToken === 'function') {
            selectedTarget.addAccelerationToken(count);
        } else if (selectedTarget &&
            typeof selectedTarget === 'object' &&
            !selectedTarget.isPlayer &&
            'accelerationTokens' in selectedTarget) {
            const descriptor = Object.getOwnPropertyDescriptor(
                selectedTarget,
                'accelerationTokens'
            );
            if (descriptor &&
                !descriptor.writable &&
                typeof descriptor.set !== 'function') {
                throw new TypeError(
                    'El objetivo no permite añadir fichas de Aceleración.'
                );
            }
            selectedTarget.accelerationTokens =
                (selectedTarget.accelerationTokens ?? 0) + count;
        } else {
            throw new TypeError('Se necesita un Plan para colocar fichas de Aceleración.');
        }

        await selectedTarget.refresh?.();
    }
}