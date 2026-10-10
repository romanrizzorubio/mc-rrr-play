export class Trigger {
    static #triggeredEffectsByTrigger = new WeakMap();

    static #getTriggeredEffects(trigger) {
        if (!Trigger.#triggeredEffectsByTrigger.has(trigger)) {
            Trigger.#triggeredEffectsByTrigger.set(trigger, new WeakSet());
        }

        return Trigger.#triggeredEffectsByTrigger.get(trigger);
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
    }
    hasTriggeredFor(effect) {
        return Boolean(effect &&
            typeof effect === 'object' &&
            Trigger.#getTriggeredEffects(this).has(effect));
    }
    markTriggeredFor(effect) {
        if (effect && typeof effect === 'object') {
            Trigger.#getTriggeredEffects(this).add(effect);
        }
    }
    canRun(params) {
        const {ability} = this;

        if (!ability) {
            return true;
        }

        return ability.canTrigger(params);
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
    getName(params) {
        return this.ability.getTitle(params);
    }
    async runCard(params) {
        const {card, ability} = this;

        this.paymentCancelled = false;
        await ability.resolveAbility({
            ...params,
            preselectedTarget: false,
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

        const result = await card.owner.triggerEvent(this, params);
        this.triggered = result.triggered;
        if (this.triggered) {
            this.markTriggeredFor(params.effect);
        }
        this.paymentCancelled = result.paymentCancelled;
    }
    runTrigger(params) {
        const {ability, card} = this;
        const isLastingAbility = Boolean(ability && ability.lasting);

        if (card.isEvent && !isLastingAbility) {
            return this.runEvent(params);
        } else {
            return this.runCard(params);
        }
    }
}