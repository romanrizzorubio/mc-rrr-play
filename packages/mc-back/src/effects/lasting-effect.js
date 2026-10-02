import {TIME_PHASE} from 'mc-shared';
import {LastingAbility} from '../abilities/misc/lasting-ability.js';
import {Lasting} from '../engine/lasting.js';

import {Effect} from './effect.js';

export class LastingEffect extends Effect {
    constructor({
        effect,
        endEffect,
        until,
        triggerType,
        hideDialog,
    }) {
        super(arguments[0]);

        this.effect = effect;
        this.endEffect = endEffect;
        this.triggerType = triggerType;
        this.until = until;
        this.hideDialog = hideDialog;
    }
    async execute(params) {
        const {effect, endEffect, ability, triggerType} = this;
        const until = this.until ?? TIME_PHASE;
        const {player} = params;

        if (!effect && !endEffect) {
            throw new Error('Un efecto lasting requiere un efecto o una limpieza al expirar.');
        }

        const lasting = new Lasting({
            match: this.match,
            until,
            effect,
            endEffect,
            player,
            card: ability.card,
            selectedTarget: this.selectedTarget,
        });

        this.createLasting(lasting);

        lasting.createEndLasting(until, params);

        if (triggerType) {
            const lastingAbility = new LastingAbility({
                lasting,
                effect,
                trigger: triggerType,
                card: ability.card,
                match: this.match,
                hideDialog: this.hideDialog,
            });
            lastingAbility.initTriggers(ability.card);
        } else if (effect) {
            effect.ability = ability;
            if (effect.target === this.target) {
                effect.selectedTarget = this.selectedTarget;
                effect.refreshTarget = false;
            }
            await effect.runEffect({
                ...params,
                lasting,
            });
        }
    }
}