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

        this.triggered = false
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

        await ability.resolveAbility({
            ...params,
            card,
        });

        this.triggered = ability.resolved;
    }
    async runEvent(params) {
        const {card} = this;

        this.triggered = await card.owner.triggerEvent(this, params);
    }
    runTrigger(params) {
        const {card} = this;

        if (card.isEvent) {
            return this.runEvent(params);
        } else {
            return this.runCard(params);
        }
    }
}