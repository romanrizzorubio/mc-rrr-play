import {Effect} from "./effect.js";
import {Delayed} from "../engine/delayed.js";

export const EFFECT_DELAYED = 'delayed';
export class DelayedEffect extends Effect {
    constructor({
        effect,
    }) {
        super(arguments[0]);

        this.effect = effect;
    }

    execute(params) {
        const {card, player} = params;
        const {selectedTarget, effect} = this;

        selectedTarget.createDelayedEffect(new Delayed({
            effect,
            card,
            player,
        }));
    }
}