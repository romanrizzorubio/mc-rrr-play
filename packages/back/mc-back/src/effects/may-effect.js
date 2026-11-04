import {Effect} from './effect.js';

export class MayEffect extends Effect {
    constructor({
// MayEffect
        effect,
        requiresPrePlayConfirmation = false,
    }) {
        super(arguments[0]);

        this.effect = effect;
        this.requiresPrePlayConfirmation = requiresPrePlayConfirmation;
    }
    get ability() {
        return super.ability;
    }
    set ability(ability) {
        super.ability = ability;

        if (this.effect) {
            this.effect.ability = ability;
        }
    }
    get isOptional() {
        return true;
    }
    get keepTriggering() {
        return this.effect.keepTriggering;
    }
    canRun(params) {
        return this.effect.canRun(params);
    }
    async prepare(params) {
        await super.prepare(params);

        const {effect} = this;

        if (effect.target === this.target) {
            effect.selectedTarget = this.selectedTarget;
        } else {
            await effect.prepare({
                ...params,
                effect: this,
            });
        }

        return this.selectedTarget;
    }
    execute(params) {
        const {effect} = this;

        return effect.runEffect({
            ...params,
            mayEffect: this,
        });
    }
    async confirmBeforeResolve(params) {
        return !this.requiresPrePlayConfirmation || this.confirm(params);
    }
    async confirm(params, {subtitle, data} = {}) {
        if (!this.title) {
            throw new TypeError('MayEffect confirmation requires a title.');
        }

        const {player} = params;
        const response = await this.openDialog({
            dialogType: 'confirm',
            showCancel: true,
            targetPlayer: player,
            title: this.title,
            subtitle,
            hand: player.hand.cards.map(card => card.toObj(params)),
            data,
        });

        return response?.confirmed === true;
    }
}