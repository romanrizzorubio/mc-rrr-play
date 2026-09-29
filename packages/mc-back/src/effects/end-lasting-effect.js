import {Effect} from "./effect.js";

export class EndLastingEffect extends Effect {
    execute(params) {
        const {ability} = this;

        ability.lasting.card.endTriggers();
    }
}