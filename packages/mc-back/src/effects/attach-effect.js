import {Effect} from './effect.js';

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
        const {selectedTarget, card} = this;

        selectedTarget.attached.push(card);
        card.attachedTo = selectedTarget;

        await selectedTarget.refresh();
    }
}