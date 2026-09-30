import {
    CHARACTER_YOU
} from "../../../constants/characters.js";
import {AttachEffect} from "../../../effects/attach-effect.js";

export const MixinAttachableCard = C => class extends C {
    constructor({
// AttachableCard
        attach = CHARACTER_YOU,
        maxAttach = 0,
    }) {
        super(arguments[0]);

        this.attach = attach;
        this.maxAttach = maxAttach;

        this.isAttachable = true;
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

        let target = this.attach;
        let ifNot = null;

        if (this.attach instanceof Object) {
            target = this.attach.target;
            ifNot = this.attach.ifNot;
        }

        const attachEffect = new AttachEffect({
            card,
            target,
            canAttach: this.canAttach.bind(this),
            match: this.match,
        });

        const targets = await attachEffect.getValidTarget(params);

        if (targets.length === 0 && ifNot) {
            const effect = this.match.abilitiesFactory.effectsFactory.createEffect(ifNot);
            return effect.runEffect(params);
        }

        return attachEffect.runEffect(params);
    }
    play({gameCard, target}) {
        super.play(arguments[0]);

        return this.attachCard(arguments[0]);
    }
}