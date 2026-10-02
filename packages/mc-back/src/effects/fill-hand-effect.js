import {DrawEffect} from './draw-effect.js';
import {Effect} from './effect.js';

export class FillHandEffect extends Effect {
    constructor({
        printed = false,
    }) {
        super(arguments[0]);

        this.printed = printed;
    }

    async execute(params) {
        const {player} = params;
        const handSize = await player.getHandSize();
        const count = handSize - player.hand.cards.length;

        if (count > 0) {
            const drawCardEffect = new DrawEffect({
                count,
                match: this.match,
            });

            await drawCardEffect.runEffect({player});
        }
    }
}