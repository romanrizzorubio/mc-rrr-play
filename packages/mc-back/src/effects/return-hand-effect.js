import {Effect} from './effect.js';

export class ReturnHandEffect extends Effect {
    async execute() {
        const {selectedTarget} = this;
        const player = selectedTarget.controller;

        await selectedTarget.remove();

        player.hand.addCards([selectedTarget]);

        await player.gameZone.refresh();
        await player.hand.refresh();
        selectedTarget.refresh();
    }
}
