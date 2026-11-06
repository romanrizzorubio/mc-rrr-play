import {Effect} from './effect.js';

export class MayEffect extends Effect {
    constructor({
// MayEffect
        effect,
        effectNot,
        requiresPrePlayConfirmation = false,
    }) {
        super(arguments[0]);

        this.effect = effect;
        this.effectNot = effectNot;
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
        if (this.effectNot) {
            this.effectNot.ability = ability;
        }
    }
    get isOptional() {
        return !this.effectNot;
    }
    get keepTriggering() {
        return this.effect.keepTriggering;
    }
    async canRun(params) {
        return await this.effect.canRun(params) ||
            Boolean(this.effectNot && await this.effectNot.canRun(params));
    }
    async prepare(params) {
        await super.prepare(params);

        const effectCanRun = !this.effectNot ||
            await this.effect.canRun(params);
        const effect = effectCanRun ? this.effect : this.effectNot;
        if (!effect) {
            return this.selectedTarget;
        }

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
    async execute(params) {
        const {effect, effectNot} = this;
        const canResolveMay = await effect.canRun(params);

        if (!effectNot) {
            return effect.runEffect({
                ...params,
                mayEffect: this,
            });
        }

        if (canResolveMay && await this.confirm(params)) {
            await effect.runEffect({
                ...params,
                mayEffect: this,
            });
            if (effect.fullResolved) {
                return;
            }
        }

        if (await effectNot.canRun(params)) {
            return effectNot.runEffect(params);
        }
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