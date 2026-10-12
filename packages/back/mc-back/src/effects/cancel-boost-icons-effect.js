import {Effect} from './effect.js';
import {getBoostIconCancellation} from '../utils/boost-icons.js';
import {path} from '../engine/utils.js';
import {
    confirmPrePlay,
    getPrePlayConfirmationCard,
} from '../utils/pre-play-confirmation.js';

export class CancelBoostIconsEffect extends Effect {
    constructor(params = {}) {
        super(params);

        this.requiresPrePlayConfirmation =
            params.requiresPrePlayConfirmation ?? false;
        this.prePlayConfirmation = params.prePlayConfirmation;
    }
    async confirmBeforeResolve(params) {
        const confirmation = this.prePlayConfirmation;
        if (!this.requiresPrePlayConfirmation && !confirmation) {
            return true;
        }

        const triggeredEffect = this.getTriggeredEffect(params);
        if (!triggeredEffect) {
            throw new TypeError(
                'CancelBoostIconsEffect requires a resolving boost effect.'
            );
        }

        const {remainingBoostIcons} =
            getBoostIconCancellation(triggeredEffect);
        if (confirmation?.countPath !== undefined &&
            (typeof confirmation.countPath !== 'string' ||
                !confirmation.countPath)) {
            throw new TypeError(
                'Boost-icon confirmation count path must be a non-empty string.'
            );
        }
        if (confirmation?.cardPath !== undefined &&
            (typeof confirmation.cardPath !== 'string' ||
                !confirmation.cardPath)) {
            throw new TypeError(
                'Boost-icon confirmation card path must be a non-empty string.'
            );
        }
        const configuredCount = confirmation?.countPath ?
            path(params, confirmation.countPath) :
            remainingBoostIcons;
        if (!Number.isSafeInteger(configuredCount) ||
            configuredCount <= 0) {
            throw new Error(
                'Boost-icon confirmation requires a positive integer icon count.'
            );
        }
        if (confirmation?.maxCount !== undefined &&
            (!Number.isSafeInteger(confirmation.maxCount) ||
                confirmation.maxCount <= 0)) {
            throw new TypeError(
                'Boost-icon confirmation max count must be a positive integer.'
            );
        }

        const boostIconCount = confirmation?.maxCount === undefined ?
            configuredCount :
            Math.min(configuredCount, confirmation.maxCount);
        const card = confirmation?.cardPath !== undefined ?
            path(params, confirmation.cardPath) :
            triggeredEffect.card;
        const cardData = getPrePlayConfirmationCard(card, params);

        return confirmPrePlay(this, params, {
            title: confirmation?.title,
            subtitle: confirmation?.subtitle,
            data: {
                ...cardData,
                boostIconCount,
                boostIconLabel: confirmation?.message,
                okText: confirmation?.okText,
                cancelText: confirmation?.cancelText,
            },
        });
    }
    getTriggeredEffect(params) {
        return [params.triggeredEffect, params.effect].find(triggeredEffect =>
            triggeredEffect?.card &&
            Number.isFinite(triggeredEffect.boostValue));
    }
    canRun(params) {
        const triggeredEffect = this.getTriggeredEffect(params);

        return Boolean(triggeredEffect) &&
            getBoostIconCancellation(triggeredEffect).remainingBoostIcons > 0 &&
            super.canRun(params);
    }
    execute(params) {
        const triggeredEffect = this.getTriggeredEffect(params);
        if (!triggeredEffect) {
            throw new TypeError('CancelBoostIconsEffect requires a resolving boost effect.');
        }

        const {
            alreadyCancelledBoostIcons,
            remainingBoostIcons,
        } = getBoostIconCancellation(triggeredEffect);

        triggeredEffect.boostValue -= remainingBoostIcons;
        triggeredEffect.cancelledBoostIcons =
            alreadyCancelledBoostIcons + remainingBoostIcons;
        params.cancelledBoostIcons = remainingBoostIcons;
    }
}
