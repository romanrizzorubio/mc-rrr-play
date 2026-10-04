import {
    EFFECT_CATEGORY_DAMAGE,
    EFFECT_TAKE_DAMAGE,
    TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE,
} from 'mc-shared';

import {Effect} from './effect.js';

export class DealDamageEffect extends Effect {
    constructor(params) {
        super(params);
        const {character, damage, overkill: _overkill = false} = params;

        this._character = character;
        this.baseDamage = damage;

        this.damage = undefined;
        this.dealtDamage = 0;
        this.preventDamage = 0;
        this.takenDamage = 0;
        this.excessDamage = 0;
    }
    get character() {
        return this._character || super.character;
    }
    get effectCategories() {
        return [EFFECT_CATEGORY_DAMAGE];
    }
    checkTrigger() {
        if (Array.isArray(this.damage)) {
            if (Array.isArray(this.preventDamage)) {
                return this.damage.some((d, index) => d > this.preventDamage[index]);
            }
            return this.damage.some(d => d > this.preventDamage);
        }
        return this.damage > this.preventDamage;
    }
    getTriggersParams(params) {
        const {selectedTarget} = this;

        const newParams = super.getTriggersParams(params);

        if (!newParams.card) {
            newParams.card = selectedTarget;
        }

        return newParams;
    }
    getTriggersEnds() {
        return super.getTriggersEnds();
    }
    getTriggersWould() {
        return super.getTriggersWould()
            .concat([
                TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE,
            ]);
    }
    async resolveParams(params) {
        const resolvedParams = await super.resolveParams(params);

        if (!this.paramsCalc ||
            this.getLastStepParam('damage', resolvedParams) !== undefined) {
            return resolvedParams;
        }

        const damage = await this.calculate({
            ...resolvedParams,
            source: this.source,
        });

        return {
            ...resolvedParams,
            damage,
        };
    }
    async prepare(params) {
        this.damage = undefined;

        await super.prepare(params);

        if (this.damage === undefined) {
            const lastStepDamage = this.getLastStepParam('damage', params);
            if (lastStepDamage !== undefined) {
                this.damage = lastStepDamage;
            } else if (this.paramsCalc) {
                if (params.damage === undefined) {
                    throw new Error('El daño calculado no llegó en los parámetros de DealDamageEffect.');
                }
                this.damage = params.damage;
            } else {
                this.damage = this.baseDamage ?? params.damage;
            }
        }

        const {isAttack, activation} = this;

        if (isAttack && activation) {
            if (activation.getOverkill(params)) {
                await activation.applyOverkill(params);
            }
        }
    }
    /** @returns {Promise<void>} */
    async execute(params) {
        const {selectedTarget, damage} = this;

        const takeDamageEffect = this.match.effectsFactory.createEffect({
            type: EFFECT_TAKE_DAMAGE,
            selectedTarget,
            damage,
            ability: this.ability,
            activation: this.activation,
            isAttack: this.isAttack,
        });

        await takeDamageEffect.runEffect(params);

        this.takenDamage = takeDamageEffect.takenDamage;

        if (this.activation) {
            this.activation.takenDamage = this.takenDamage;
        }
    }
}