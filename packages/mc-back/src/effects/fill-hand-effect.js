import {Effect} from "./effect.js";
import {DrawEffect} from "./draw-effect.js";

export class FillHandEffect extends Effect {
    constructor({
        printed = false,
    }) {
        super(arguments[0]);

        this.printed = printed;
    }

    execute(params) {
        const {player} = params;
        const count = player.handSize - player.hand.cards.length;

        if (count > 0) {
            const drawCardEffect = new DrawEffect({
                count,
                match: this.match,
            });

            return drawCardEffect.runEffect({player});
        }
    }
}