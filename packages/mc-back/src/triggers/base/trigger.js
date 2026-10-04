export class Trigger {
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
            triggeredCard: params.card,
            card,
        });

        this.triggered = ability.resolved;
        this.paymentCancelled = ability.paymentCancelled;
    }
    async runEvent(params) {
        const {card} = this;

        const result = await card.owner.triggerEvent(this, params);
        this.triggered = result.triggered;
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