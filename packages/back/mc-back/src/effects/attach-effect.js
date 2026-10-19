import {Effect} from './effect.js';
import {getAttachmentHost} from '../utils/attachment-utils.js';

export class AttachEffect extends Effect {
    constructor({
        card,
    }) {
        super(arguments[0]);

        this.card = card;
    }
    filterTarget(target, {player}) {
        if (super.filterTarget.apply(this, arguments)) {
            const {card} = this;

            return card.canAttach(target, player);

            return true;
        }

        return false;
    }

    async execute(_params) {
        const {card, selectedTarget} = this;
        const attachedTo = getAttachmentHost(selectedTarget);

        attachedTo.attached.push(card);
        card.attachedTo = attachedTo;

        await attachedTo.refresh();
    }
}