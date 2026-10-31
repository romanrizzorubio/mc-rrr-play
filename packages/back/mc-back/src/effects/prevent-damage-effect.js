import {Effect} from './effect.js';
import {path} from '../engine/utils.js';
import {
    confirmPrePlay,
    getPrePlayConfirmationCard,
} from '../utils/pre-play-confirmation.js';

const MAX_PREVENTABLE_DAMAGE = Number.MAX_SAFE_INTEGER;

export class PreventDamageEffect extends Effect {
    static isPendingAttack(effect) {
        return Boolean(effect?.isAttack && !effect.resolved &&
            ((effect.damage === undefined &&
                typeof effect.getAttackValue === 'function') ||
                (effect.takenDamage === 0 &&
                    effect.activation?.effect === effect)));
    }

    constructor({
        damage = 0,
        preventAll = false,
        requiresPrePlayConfirmation = false,
        prePlayConfirmation,
    }) {
        super(arguments[0]);

        this.damage = damage;
        this.preventAll = preventAll;
        this.requiresPrePlayConfirmation =
            requiresPrePlayConfirmation;
        this.prePlayConfirmation = prePlayConfirmation;
    }
    async getPreventionDamage(params) {
        const damage = this.getLastStepParam('damage', params) ??
            (this.paramsCalc ? await this.calculate(params) : this.damage);
        if (!Number.isSafeInteger(damage) || damage < 0) {
            throw new TypeError('La cantidad de daño a evitar debe ser un entero no negativo.');
        }

        return damage;
    }
    async confirmBeforeResolve(params) {
        const confirmation = this.prePlayConfirmation;
        if (!this.requiresPrePlayConfirmation && !confirmation) {
            return true;
        }

        if (confirmation?.countPath !== undefined &&
            (typeof confirmation.countPath !== 'string' ||
                !confirmation.countPath)) {
            throw new TypeError(
                'Damage-prevention confirmation count path must be a non-empty string.'
            );
        }
        const triggeredDamage = params.triggeredTargetDamage;
        const damage = await this.getPreventionDamage(params);
        const calculatedDamage = this.preventAll ?
            triggeredDamage :
            Math.min(triggeredDamage, damage);
        const configuredDamage = confirmation?.countPath ?
            path(params, confirmation.countPath) :
            calculatedDamage;
        if (!Number.isSafeInteger(configuredDamage) ||
            configuredDamage <= 0) {
            throw new Error(
                'Damage-prevention confirmation requires a positive integer damage amount.'
            );
        }
        if (confirmation?.maxCount !== undefined &&
            (!Number.isSafeInteger(confirmation.maxCount) ||
                confirmation.maxCount <= 0)) {
            throw new TypeError(
                'Damage-prevention confirmation max count must be a positive integer.'
            );
        }

        const preventedDamage = confirmation?.maxCount === undefined ?
            configuredDamage :
            Math.min(configuredDamage, confirmation.maxCount);
        const cardData = getPrePlayConfirmationCard(
            this.ability?.card,
            params
        );

        return confirmPrePlay(this, params, {
            title: confirmation?.title,
            subtitle: confirmation?.subtitle,
            data: {
                ...cardData,
                preventedDamage,
                preventedDamageLabel: confirmation?.message,
                okText: confirmation?.okText,
                cancelText: confirmation?.cancelText,
            },
        });
    }
    async canRun(params) {
        const {effect} = params;
        const damage = await this.getPreventionDamage(params);
        const isPendingAttack = PreventDamageEffect.isPendingAttack(effect);
        const takenDamage = params.triggeredTarget ?
            params.triggeredTargetDamage :
            effect.takenDamage;
        const canPreventDamage = Array.isArray(takenDamage) ?
            takenDamage.some(damage => damage > 0) :
            takenDamage > 0;

        return (this.preventAll || damage > 0) &&
            (isPendingAttack || canPreventDamage) && super.canRun(params);
    }
    async execute(params) {
        const {effect} = params;
        const damage = await this.getPreventionDamage(params);

        if (effect?.isAttack &&
            effect.damage === undefined &&
            typeof effect.getAttackValue === 'function') {
            const preventDamage = this.preventAll ?
                MAX_PREVENTABLE_DAMAGE :
                damage;
            effect.preventDamage = Math.min(
                MAX_PREVENTABLE_DAMAGE,
                (effect.preventDamage || 0) + preventDamage
            );
            return;
        }

        if (params.triggeredTarget) {
            const targets = Array.isArray(effect.selectedTarget) ?
                effect.selectedTarget :
                [effect.selectedTarget];
            const targetIndex = targets.findIndex(target =>
                target?.id === params.triggeredTarget.id &&
                target.name === params.triggeredTarget.name
            );
            if (targetIndex < 0) {
                throw new Error('PreventDamageEffect could not find the triggered damage target.');
            }

            const prevention = Array.isArray(effect.preventDamage) ?
                effect.preventDamage.slice() :
                targets.map(() => effect.preventDamage || 0);

            if (this.preventAll) {
                prevention[targetIndex] = PreventDamageEffect.isPendingAttack(effect) ?
                    MAX_PREVENTABLE_DAMAGE :
                    Array.isArray(effect.damage) ?
                    effect.damage[targetIndex] :
                    effect.damage;
            } else {
                prevention[targetIndex] += damage;
            }

            effect.preventDamage = Array.isArray(effect.selectedTarget) ?
                prevention :
                prevention[0];
            return;
        }

        if (this.preventAll) {
            effect.preventDamage = effect.damage;
        } else {
            effect.preventDamage += damage;
        }
    }
}