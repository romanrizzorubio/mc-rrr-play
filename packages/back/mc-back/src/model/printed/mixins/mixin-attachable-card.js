import {TARGET_YOU} from 'mc-shared';
import {AttachEffect} from '../../../effects/attach-effect.js';

export const MixinAttachableCard = C => class extends C {
    constructor({
// AttachableCard
        attach = TARGET_YOU,
        maxAttach = 0,
    }) {
        super(arguments[0]);

        this.attach = attach;
        this.maxAttach = maxAttach;

        this.isAttachable = true;
    }
    getAttachConfig() {
        return this.attach && typeof this.attach === 'object' ?
            this.attach :
            {target: this.attach};
    }
    createAttachEffect(card) {
        const {target} = this.getAttachConfig();

        return new AttachEffect({
            card,
            target,
            canAttach: this.canAttach.bind(this),
            match: this.match,
        });
    }
    canAttach(card) {
        if (this.maxAttach > 0) {
            const attached = card.attached.filter(attached => attached.card.id === this.id);
            if (attached.length >= this.maxAttach) {
                return false;
            }
        }

        return true;
    }
    async attachCard(params) {
        const {card} = params;
        const {ifNot} = this.getAttachConfig();
        const attachEffect = this.createAttachEffect(card);

        const targets = await attachEffect.getValidTarget(params);

        if (targets.length === 0 && ifNot) {
            const effect = this.match.abilitiesFactory.effectsFactory.createEffect(ifNot);
            return effect.runEffect(params);
        }

        return attachEffect.runEffect(params);
    }
    play({gameCard: _gameCard, target: _target}) {
        super.play(arguments[0]);

        return this.attachCard(arguments[0]);
    }
};