import {Engine} from './engine.js';

export class Delayed extends Engine {
    constructor({
        card,
        player,
        effect,
    }) {
        super(arguments[0]);

        this.card = card;
        this.player = player;
        this.effect = effect;
    }
    resolve(params = {}) {
        const {card, player, effect} = this;

        const _params = {
            ...params
        };

        if (!_params.card) {
            _params.card = card;
        }
        if (!_params.player) {
            _params.player = player;
        }

        return effect.runEffect(_params);
    }
}