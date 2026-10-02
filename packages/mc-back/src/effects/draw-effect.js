import {TARGET_PLAYER} from 'mc-shared';

import {AddHandEffect} from './add-hand-effect.js';
import {Effect} from './effect.js';

export class DrawEffect extends Effect {
    constructor({
// DrawEffect
        target: _target = TARGET_PLAYER,
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