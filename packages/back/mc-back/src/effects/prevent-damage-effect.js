import {Effect} from './effect.js';
import {path} from '../engine/utils.js';
import {
    confirmPrePlay,
    getPrePlayConfirmationCard,
} from '../utils/pre-play-confirmation.js';

export class PreventDamageEffect extends Effect {
    constructor({
        damage = 0,
        requiresPrePlayConfirmation = false,
        prePlayConfirmation,
    }) {
        super(arguments[0]);

        this.damage = damage;
        this.requiresPrePlayConfirmation =
            requiresPrePlayConfirmation;
        this.prePlayConfirmation = prePlayConfirmation;
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
        const calculatedDamage = this.damage > 0 ?
            Math.min(triggeredDamage, this.damage) :
            triggeredDamage;
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
    canRun(params) {
        const {effect} = params;
        const takenDamage = params.triggeredTarget ?
            params.triggeredTargetDamage :
            effect.takenDamage;
        const canPreventDamage = Array.isArray(takenDamage) ?
            takenDamage.some(damage => damage > 0) :
            takenDamage > 0;

        return canPreventDamage && super.canRun(params);
    }
    execute(params) {
        const {effect} = params;

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

            if (this.damage) {
                prevention[targetIndex] += this.damage;
            } else {
                prevention[targetIndex] = Array.isArray(effect.damage) ?
                    effect.damage[targetIndex] :
                    effect.damage;
            }

            effect.preventDamage = Array.isArray(effect.selectedTarget) ?
                prevention :
                prevention[0];
            return;
        }

        if (this.damage) {
            effect.preventDamage += this.damage;
        } else {
            effect.preventDamage = effect.damage;
        }
    }
}