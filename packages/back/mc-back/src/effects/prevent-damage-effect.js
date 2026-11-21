import {DIALOG_SELECT_NUMBER} from 'mc-shared';

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
        selectDamage = false,
        requiresPrePlayConfirmation = false,
        prePlayConfirmation,
    }) {
        super(arguments[0]);

        this.damage = damage;
        this.preventAll = preventAll;
        if (typeof selectDamage !== 'boolean') {
            throw new TypeError('PreventDamageEffect selectDamage must be a boolean.');
        }
        this.selectDamage = selectDamage;
        this.requiresPrePlayConfirmation =
            requiresPrePlayConfirmation;
        this.prePlayConfirmation = prePlayConfirmation;
        this.outputParams = ['preventedDamage'];
        this.preventedDamage = 0;
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.preventedDamage = 0;
    }
    async getPreventionDamage(params) {
        const damage = this.getLastStepParam('damage', params) ??
            (this.paramsCalc ? await this.calculate(params) : this.damage);
        if (!Number.isSafeInteger(damage) || damage < 0) {
            throw new TypeError('La cantidad de daño a evitar debe ser un entero no negativo.');
        }

        return damage;
    }
    async selectPreventionDamage(params, damage) {
        if (!this.selectDamage) {
            return damage;
        }

        const incomingDamage = params.triggeredTargetDamage;
        if (!params.triggeredTarget) {
            throw new TypeError(
                'Selectable damage prevention requires a target-specific damage trigger context.'
            );
        }
        if (!Number.isSafeInteger(incomingDamage) || incomingDamage < 0) {
            throw new TypeError(
                'Selectable damage prevention requires a non-negative integer triggeredTargetDamage.'
            );
        }

        const maxDamage = Math.min(
            incomingDamage,
            this.preventAll ? incomingDamage : damage
        );
        const response = await this.openDialog({
            dialogType: DIALOG_SELECT_NUMBER,
            targetPlayer: params.player,
            title: this.dialogTitle ||
                this.ability?.card?.name ||
                'Elige cuánto daño quieres evitar',
            subtitle: `Vas a sufrir ${incomingDamage} de daño. Puedes evitar hasta ${maxDamage}.`,
            data: {
                label: 'Daño que quieres evitar',
                min: 0,
                max: maxDamage,
                step: 1,
            },
        });
        const selectedDamage = response?.value;
        if (!Number.isSafeInteger(selectedDamage) ||
            selectedDamage < 0 ||
            selectedDamage > maxDamage) {
            throw new Error(
                'PreventDamageEffect received an invalid selected damage amount.'
            );
        }

        return selectedDamage;
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
        const damageToPrevent = await this.selectPreventionDamage(
            params,
            damage
        );
        this.preventedDamage = 0;

        if (effect?.isAttack &&
            effect.damage === undefined &&
            typeof effect.getAttackValue === 'function') {
            const preventDamage = this.preventAll && !this.selectDamage ?
                MAX_PREVENTABLE_DAMAGE :
                damageToPrevent;
            effect.preventDamage = Math.min(
                MAX_PREVENTABLE_DAMAGE,
                (effect.preventDamage || 0) + preventDamage
            );
            if (this.selectDamage) {
                this.preventedDamage = Math.min(
                    params.triggeredTargetDamage,
                    damageToPrevent
                );
            }
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
            const incomingDamage = Array.isArray(effect.damage) ?
                effect.damage[targetIndex] :
                effect.damage;
            const damageRemaining = Number.isFinite(params.triggeredTargetDamage) ?
                params.triggeredTargetDamage :
                Math.max(0, incomingDamage - (prevention[targetIndex] || 0));
            this.preventedDamage = Math.max(
                0,
                Math.min(
                    damageRemaining,
                    this.preventAll && !this.selectDamage ?
                        damageRemaining :
                        damageToPrevent
                )
            );

            if (this.preventAll && !this.selectDamage) {
                prevention[targetIndex] = PreventDamageEffect.isPendingAttack(effect) ?
                    MAX_PREVENTABLE_DAMAGE :
                    Array.isArray(effect.damage) ?
                    effect.damage[targetIndex] :
                    effect.damage;
            } else {
                prevention[targetIndex] += damageToPrevent;
            }

            effect.preventDamage = Array.isArray(effect.selectedTarget) ?
                prevention :
                prevention[0];
            return;
        }

        if (this.preventAll && !this.selectDamage) {
            effect.preventDamage = effect.damage;
        } else {
            effect.preventDamage += damageToPrevent;
        }
    }
}