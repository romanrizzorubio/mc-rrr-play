import {EndLastingAbility} from '../abilities/misc/end-lasting-ability.js';
import {TIME_PHASE} from '../constants/times.js';
import {EndLastingEffect} from '../effects/end-lasting-effect.js';

import {Engine} from './engine.js';
import {path} from './utils.js';

export class Lasting extends Engine {
    constructor({
        card,
        player,
        effect,
        until = TIME_PHASE,
    }) {
        super(arguments[0]);

        this.card = card;
        this.player = player;
        this.effect = effect;
        this.until = until;
    }
    get match() {
        return path(this, 'effect.match');
    }
    createEndLasting(until, params) {
        const {card} = this;

        if (until instanceof Array) {
            until.forEach(_until => {
                this.createEndLasting(_until, params);
            });
        } else {
            const endLastingAbility = new EndLastingAbility({
                trigger: until,
                lasting: this,
                effect: new EndLastingEffect({
                    match: this.match,
                }),
                match: this.match,
            });

            endLastingAbility.initTriggers(card);
        }
    }
    resolve(params = {}) {
        const {until} = this;

        this.createEndLasting(until, params);
    }
}