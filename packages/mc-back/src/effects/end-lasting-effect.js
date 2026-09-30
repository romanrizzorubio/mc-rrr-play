import {Effect} from './effect.js';

export class EndLastingEffect extends Effect {
    execute(_params) {
        const {ability} = this;

        ability.lasting.card.endTriggers();
    }
}