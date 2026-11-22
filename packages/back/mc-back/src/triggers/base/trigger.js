import {AsyncLocalStorage} from 'node:async_hooks';
import {
    ABILITY_ALTEREGO_INTERRUPT,
    ABILITY_ALTEREGO_RESPONSE,
    ABILITY_CONSTANT,
    ABILITY_HERO_INTERRUPT,
    ABILITY_HERO_RESPONSE,
    ABILITY_INTERRUPT,
    ABILITY_RESPONSE,
    TRIGGER_PLAYER_CAN_PLAY,
} from 'mc-shared';

import {
    getTriggerCardPlayer,
    isEventInPlayerHand,
} from '../../utils/trigger-card-player.js';

function isLastingAbility(ability) {
    return Boolean(ability?.lasting);
}

export class Trigger {
    static #playableEventAbilityTypes = new Set([
        ABILITY_INTERRUPT,
        ABILITY_RESPONSE,
        ABILITY_HERO_INTERRUPT,
        ABILITY_HERO_RESPONSE,
        ABILITY_ALTEREGO_INTERRUPT,
        ABILITY_ALTEREGO_RESPONSE,
    ]);
    static #triggeredEffectsByTrigger = new WeakMap();
    static #resolutionQueuesByTrigger = new WeakMap();
    static #resolutionContext = new AsyncLocalStorage();
    static #skipResolutionQueue = Symbol('skip-trigger-resolution-queue');

    static #getTriggeredEffects(trigger) {
        if (!Trigger.#triggeredEffectsByTrigger.has(trigger)) {
            Trigger.#triggeredEffectsByTrigger.set(trigger, new WeakMap());
        }

        return Trigger.#triggeredEffectsByTrigger.get(trigger);
    }
    static #getResolutionQueue(trigger) {
        if (!Trigger.#resolutionQueuesByTrigger.has(trigger)) {
            Trigger.#resolutionQueuesByTrigger.set(trigger, {
                pending: Promise.resolve(),
                pendingCount: 0,
            });
        }

        return Trigger.#resolutionQueuesByTrigger.get(trigger);
    }

    constructor({
        card,
        ability,
        trigger,
        triggerParams,
    }) {
        this.card = card;
        this.ability = ability;
        this.trigger = trigger;
        this.triggerParams = triggerParams;

        this.triggered = false;
        this.paymentCancelled = false;
        this.resolving = false;
    }
    hasTriggeredFor(effect) {
        if (!effect || typeof effect !== 'object') {
            return false;
        }

        const triggeredEffects = Trigger.#getTriggeredEffects(this);

        return triggeredEffects.has(effect) &&
            triggeredEffects.get(effect) === effect.triggerResolutionId;
    }
    markTriggeredFor(effect) {
        if (effect && typeof effect === 'object') {
            Trigger.#getTriggeredEffects(this).set(
                effect,
                effect.triggerResolutionId
            );
        }
    }
    canRun(params = {}) {
        const skipResolutionQueue =
            params[Trigger.#skipResolutionQueue];
        const resolutionContext = Trigger.#resolutionContext.getStore() ?? [];
        if (!skipResolutionQueue && resolutionContext.includes(this)) {
            return false;
        }
        if (!skipResolutionQueue) {
            const queue = Trigger.#getResolutionQueue(this);
            if (queue.pendingCount > 0) {
                return queue.pending.then(() => this.canRun({
                    ...params,
                    [Trigger.#skipResolutionQueue]: true,
                }));
            }
        }

        const {ability} = this;
        const abilityParams = {...params};
        delete abilityParams[Trigger.#skipResolutionQueue];
        const canTriggerAbility = () => {
            if (!ability) {
                return true;
            }

            return ability.canTrigger({
                ...abilityParams,
                triggeredCard: abilityParams.card,
                triggeredEffect: abilityParams.effect,
            });
        };

        if (this.card?.isEvent &&
            !isLastingAbility(ability)) {
            const isPlayingConstant = this.card.isPlaying &&
                ability?.abilityType === ABILITY_CONSTANT;
            if (!isPlayingConstant &&
                !isEventInPlayerHand(this.card, abilityParams.player)) {
                return false;
            }

            if (isPlayingConstant) {
                return canTriggerAbility();
            }

            const canPlayEvent = typeof this.card.canPlay === 'function' ?
                this.card.canPlay({
                    ...abilityParams,
                    abilityType: ability?.abilityType,
                }) :
                true;

            return Promise.resolve(canPlayEvent).then(async canPlay => {
                if (!canPlay) {
                    return false;
                }

                if (this.trigger !== TRIGGER_PLAYER_CAN_PLAY &&
                    typeof abilityParams.player?.canPlayCard === 'function' &&
                    !await abilityParams.player.canPlayCard({
                        card: this.card,
                    })) {
                    return false;
                }

                if (!await canTriggerAbility()) {
                    return false;
                }

                if (!Trigger.#playableEventAbilityTypes.has(
                    ability?.abilityType
                )) {
                    return true;
                }

                const player = abilityParams.player;
                if (typeof player?.canPayEventResourceCost !== 'function') {
                    const requirement = this.card.requirement ??
                        this.card.card?.requirement ??
                        [];
                    if ((this.card.cost ?? 0) === 0 &&
                        requirement.length === 0) {
                        return true;
                    }

                    throw new TypeError(
                        'Event cost availability requires a player payment check.'
                    );
                }

                return player.canPayEventResourceCost({
                    ...abilityParams,
                    ability,
                    card: this.card,
                });
            });
        }

        return canTriggerAbility();
    }
    canTrigger(params) {
        return this.canRun(params);
    }
    get isChoose() {
        return this.ability.effect.isChoose;
    }
    get isChooseAbility() {
        return this.ability.effect.isChooseAbility;
    }
    get keepTriggering() {
        return this.ability.keepTriggering;
    }
    get isOptional() {
        return this.ability?.effect?.isOptional ?? false;
    }
    getName(params) {
        if (this.ability.isInterrupt) {
            const name = this.getInterruptName(params);
            if (name !== undefined) {
                return name;
            }
        }

        return this.ability.getTitle(params);
    }
    getDialogTitle(params) {
        return this.ability?.getTriggerDialogTitle?.(params);
    }
    getInterruptName() {}
    getAbilityParams(params) {
        const abilityParams = {...params};
        const player = getTriggerCardPlayer(this.card, params.player);
        delete abilityParams.preselectedEffectTargets;
        delete abilityParams.prePlayConfirmationAcceptedFor;

        return {
            ...abilityParams,
            ...(player?.isPlayer ? {player} : {}),
            fixedPreselectedTarget: false,
            triggeredEffect: params.effect,
        };
    }
    async runCard(params) {
        const {card, ability} = this;
        const abilityParams = this.getAbilityParams(params);
        const selectedTriggerTarget = params.selectedTriggerTarget;
        const selectedTargets = selectedTriggerTarget &&
            ability.effect?.getValidTarget ?
            (await ability.effect.getValidTarget(abilityParams)).flat(Infinity) :
            [];
        const preselectedTarget = selectedTargets.find(target =>
            target === selectedTriggerTarget ||
            (selectedTriggerTarget?.id !== undefined &&
                target?.id === selectedTriggerTarget.id));

        this.paymentCancelled = false;
        await ability.resolveAbility({
            ...abilityParams,
            preselectedTarget: Boolean(preselectedTarget),
            ...(preselectedTarget ? {
                selectedTarget: preselectedTarget,
            } : {}),
            triggeredCard: params.card,
            card,
        });

        this.triggered = ability.resolved;
        if (this.triggered) {
            this.markTriggeredFor(params.effect);
        }
        this.paymentCancelled = ability.paymentCancelled;
    }
    async runEvent(params) {
        const {card} = this;

        const result = await card.owner.triggerEvent(
            this,
            this.getAbilityParams(params)
        );
        this.triggered = result.triggered;
        if (this.triggered) {
            this.markTriggeredFor(params.effect);
        }
        this.paymentCancelled = result.paymentCancelled;
    }
    async runTrigger(params, isResolutionActive = () => true) {
        const {ability, card} = this;
        const resolutionContext = Trigger.#resolutionContext.getStore() ?? [];
        if (resolutionContext.includes(this)) {
            return;
        }

        const queue = Trigger.#getResolutionQueue(this);
        const queued = queue.pendingCount > 0;
        const previous = queue.pending;
        let release;
        const current = new Promise(resolve => {
            release = resolve;
        });
        queue.pendingCount++;
        queue.pending = previous.then(() => current);

        await previous;
        try {
            if (!isResolutionActive() ||
                (this.hasTriggeredFor(params.effect) && !this.keepTriggering)) {
                return;
            }

            const canRecheck = queued &&
                (this.canTrigger !== Trigger.prototype.canTrigger ||
                    typeof ability?.canTrigger === 'function');
            if (canRecheck) {
                const canRun = await Trigger.#resolutionContext.run(
                    [...resolutionContext, this],
                    () => this.canTrigger({
                        ...params,
                        [Trigger.#skipResolutionQueue]: true,
                    })
                );
                if (!canRun || !isResolutionActive()) {
                    return;
                }
            }

            this.resolving = true;
            await Trigger.#resolutionContext.run(
                [...resolutionContext, this],
                async () => {
                    if (card.isEvent &&
                        !isLastingAbility(ability) &&
                        ability?.abilityType !== ABILITY_CONSTANT) {
                        await this.runEvent(params);
                    } else {
                        await this.runCard(params);
                    }
                }
            );
        } finally {
            this.resolving = false;
            queue.pendingCount--;
            release();
        }
    }
}