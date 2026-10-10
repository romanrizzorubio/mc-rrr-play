import {Effect} from './effect.js';

export class DiscardFromHandEffect extends Effect {
    async execute(params) {
        const {player} = params;

        const {selectedTarget} = this;

        if (selectedTarget.isEvent) {
            selectedTarget.endTriggers();
        }

        await player.hand.discardHand(selectedTarget);
        await player.hand.refresh();

        await player.deck.discard(selectedTarget);
        player.deck.refresh();
    }
}