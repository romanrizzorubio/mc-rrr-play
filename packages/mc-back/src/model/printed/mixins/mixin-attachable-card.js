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
    attachCard(params) {
        const {card} = params;

        const attachEffect = new AttachEffect({
            card,
            target: this.attach,
            canAttach: this.canAttach.bind(this),
            match: this.match,
        });

        return attachEffect.runEffect(params);
    }
    play({gameCard, target}) {
        super.play(arguments[0]);

        return this.attachCard(arguments[0]);
    }
}