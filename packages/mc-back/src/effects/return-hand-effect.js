import {Effect} from "./effect.js";

export const EFFECT_RETURN_HAND = 'return-hand';
export class ReturnHandEffect extends Effect {
    async execute(params) {
        const {selectedTarget} = this;
        const player = selectedTarget.controller;

        await selectedTarget.remove();

        player.hand.addCards([selectedTarget]);

        player.hand.refresh();
        selectedTarget.refresh();
    }
}
