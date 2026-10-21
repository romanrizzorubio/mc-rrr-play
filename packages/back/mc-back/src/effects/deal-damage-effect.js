import {
    EFFECT_CATEGORY_DAMAGE,
    EFFECT_TAKE_DAMAGE,
    TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE,
} from 'mc-shared';

import {Effect} from './effect.js';
import {Calc} from '../engine/calc.js';

export class DealDamageEffect extends Effect {
    constructor(params) {
        super(params);
        const {
            character,
            damage,
            ignoreTough = false,
            requiredForAvailability,
        } = params;

        this._character = character;
        this.ignoreTough = ignoreTough;
        this.requiredForAvailability = requiredForAvailability;
        this.baseDamage = damage;
        this.damageModifier = 0;
        this.targetCountCalc = params.targetCountCalc;
        this.selectCount = params.selectCount;

        this.damage = undefined;
        this.dealtDamage = 0;
        this.preventDamage = 0;
        this.takenDamage = 0;
        this.excessDamage = 0;
        this.defeated = false;
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.dealtDamage = 0;
        this.preventDamage = 0;
        this.takenDamage = 0;
        this.excessDamage = 0;
        this.defeated = false;
    }
    get character() {
        return this._character || super.character;
    }
    get effectCategories() {
        return [EFFECT_CATEGORY_DAMAGE];
    }
    get isRequiredForAbilityAvailability() {
        return this.requiredForAvailability ?? this.isAttack;
    }
    checkTrigger(params) {
        if (!this.isActivationActive(params)) {
            return false;
        }

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

        if (this.targetCountCalc) {
            const selectCount = await new Calc(this.targetCountCalc)
                .calculate({...resolvedParams, effect: this});
            if (!Number.isSafeInteger(selectCount) || selectCount < 0) {
                throw new Error('El número calculado de objetivos debe ser un entero no negativo.');
            }
            this.selectCount = selectCount;
        }

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
        this.dealtDamage = 0;
        this.preventDamage = 0;
        this.takenDamage = 0;
        this.excessDamage = 0;
        this.defeated = false;

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
        if (Array.isArray(this.damage)) {
            this.damage = this.damage.map(damage => damage + this.damageModifier);
        } else if (Number.isFinite(this.damage)) {
            this.damage += this.damageModifier;
        } else if (this.damageModifier) {
            throw new TypeError('DealDamageEffect requires a numeric damage value to modify.');
        }

    }
    /** @returns {Promise<void>} */
    async execute(params) {
        this.defeated = false;

        if (Array.isArray(this.selectedTarget) &&
            this.selectedTarget.length === 0) {
            return;
        }

        const {ability} = this;
        if (this.isAttack && ability?.isBasic &&
            typeof ability.getAttackValue === 'function') {
            const attackValue = await ability.getAttackValue(params);
            this.damage = attackValue +
                (this.modifyAttack ?? 0) +
                this.damageModifier;
        }

        const {activation} = this;
        if (this.isAttack && activation?.getOverkill?.(params)) {
            await activation.applyOverkill(params);
        }

        const {selectedTarget, damage} = this;
        const takeDamageEffect = this.match.effectsFactory.createEffect({
            type: EFFECT_TAKE_DAMAGE,
            selectedTarget,
            damage,
            ignoreTough: this.ignoreTough,
            ability: this.ability,
            activation: this.activation,
            isAttack: this.isAttack,
            keywords: {piercing: this.piercing},
        });

        await takeDamageEffect.runEffect(params);

        this.takenDamage = takeDamageEffect.takenDamage;
        this.defeated = takeDamageEffect.defeated === true;

        if (this.activation) {
            this.activation.takenDamage = this.takenDamage;
        }
    }
}