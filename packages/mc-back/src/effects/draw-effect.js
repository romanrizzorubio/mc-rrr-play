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
        const count = this.paramsCalc ?
            await this.calculate(params) :
            this.count;

        if (!Number.isFinite(count)) {
            throw new Error('El cálculo de cartas a robar no es válido.');
        }

        const cards = await this.selectedTarget.deck.draw(count);
        const addHandEffect = new AddHandEffect({
            player,
            match: this.match,
        });

        await addHandEffect.runEffect({cards, player});
    }
}