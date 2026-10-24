import {
    TRIGGER_ATTACHED_GET_THWART,
    TRIGGER_SCHEME_GET_THWART,
    TRIGGER_THIS_GET_THWART,
    TRIGGER_YOUR_HERO_GET_THWART
} from 'mc-shared';

import {Effect} from './effect.js';

export class GetThwartEffect extends Effect {
    constructor({scheme, ...params} = {}) {
        super(params);

        this.scheme = scheme;
        this.thwart = 0;
        this.modifyThwart = 0;
        this.thwartOverride = undefined;
        this.thwartAlternative = undefined;
        this.thwartAlternativeMayEffect = undefined;
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.thwart = 0;
        this.modifyThwart = 0;
        this.thwartOverride = undefined;
        this.thwartAlternative = undefined;
        this.thwartAlternativeMayEffect = undefined;
    }
    getTriggersInit() {
        const triggers = super.getTriggersInit()
            .concat([
                TRIGGER_YOUR_HERO_GET_THWART,
                TRIGGER_THIS_GET_THWART,
                TRIGGER_ATTACHED_GET_THWART,
            ]);

        if (this.scheme) {
            triggers.push(TRIGGER_SCHEME_GET_THWART);
        }

        return triggers;
    }
    getTriggersParams(params) {
        const triggerParams = super.getTriggersParams(params);
        if (!this.scheme) {
            return triggerParams;
        }

        return {
            ...triggerParams,
            character: this.selectedTarget,
            scheme: this.scheme,
        };
    }
    setThwartValue(value) {
        if (!Number.isFinite(value)) {
            throw new TypeError('GetThwartEffect requires a finite thwart value.');
        }

        this.thwartOverride = value;
    }
    setThwartAlternative(value, mayEffect) {
        if (!Number.isFinite(value)) {
            throw new TypeError('GetThwartEffect requires a finite thwart value.');
        }
        if (typeof mayEffect?.confirm !== 'function') {
            throw new TypeError(
                'An optional thwart value requires its MayEffect.'
            );
        }

        this.thwartAlternative = value;
        this.thwartAlternativeMayEffect = mayEffect;
    }
    async chooseThwartValue(params) {
        const attackValue = this.thwartAlternative;
        if (attackValue === undefined) {
            return this.thwart;
        }

        const intValue = this.thwart;
        const character = {
            ...this.selectedTarget.toObj(params),
            attack: attackValue,
            thwart: intValue,
        };
        const scheme = this.scheme.toObj(params);
        const confirmed = await this.thwartAlternativeMayEffect.confirm(params, {
            subtitle: `Intervención básica contra ${this.scheme.name}. Amenaza restante: ${this.scheme.threat}.`,
            data: {
                thwartValueChoice: {
                    character,
                    scheme,
                },
                okText: 'OK',
                cancelText: 'Cancelar',
            },
        });

        if (confirmed) {
            this.thwart = attackValue;
        }

        return this.thwart;
    }
    async execute(_params) {
        const {selectedTarget, modifyThwart, thwartOverride} = this;

        if (selectedTarget.thwart !== null) {
            this.thwart = thwartOverride ??
                selectedTarget.thwart + modifyThwart;
        }
    }
}