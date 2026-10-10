import {EndLastingAbility} from '../abilities/misc/end-lasting-ability.js';
import {TIME_PHASE, TIME_TRIGGER_MAP} from 'mc-shared';
import {EndLastingEffect} from '../effects/end-lasting-effect.js';

import {Engine} from './engine.js';
import {path} from './utils.js';

export class Lasting extends Engine {
    constructor({
        card,
        match,
        player,
        effect,
        endEffect,
        selectedTarget,
        until = TIME_PHASE,
    }) {
        super(arguments[0]);

        this.card = card;
        this._match = match;
        this.player = player;
        this.effect = effect;
        this.endEffect = endEffect;
        this.selectedTarget = selectedTarget;
        this.until = until;
        this.cleanups = [];
    }
    get match() {
        return this._match || path(this, 'effect.match');
    }
    createEndLasting(until, params) {
        const {card} = this;

        if (until instanceof Array) {
            until.forEach(_until => {
                this.createEndLasting(_until, params);
            });
        } else {
            const trigger = TIME_TRIGGER_MAP[until] ?? until;
            const endLastingAbility = new EndLastingAbility({
                trigger,
                lasting: this,
                effect: new EndLastingEffect({
                    match: this.match,
                }),
                match: this.match,
                hideDialog: true,
            });

            endLastingAbility.initTriggers(card);
        }
    }
    registerCleanup(effect, selectedTarget) {
        effect.selectedTarget = selectedTarget;
        effect.refreshTarget = false;
        this.cleanups.push(effect);
    }
    resolve(params = {}) {
        const {until} = this;

        this.createEndLasting(until, params);
    }
}