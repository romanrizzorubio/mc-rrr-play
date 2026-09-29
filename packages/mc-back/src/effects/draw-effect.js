import {Effect} from "./effect.js";
import {TARGET_PLAYER, TARGET_YOU} from "../constants/targets.js";
import {AddHandEffect} from "./add-hand-effect.js";

export const EFFECT_DRAW_CARD = 'draw';
export class DrawEffect extends Effect {
    constructor({
// DrawEffect
        target = TARGET_PLAYER,
        count = 1,
    }) {
        super(arguments[0]);

        this.count = count;
    }
    async execute(params) {
        const {player} = params;

        const cards = await this.selectedTarget.deck.draw(this.count);
        const addHandEffect = new AddHandEffect({
            player,
            match: this.match,
        });

        await addHandEffect.runEffect({cards, player});
    }
}