import {TIME_PHASE} from 'mc-shared';
import {LastingAbility} from '../abilities/misc/lasting-ability.js';
import {Lasting} from '../engine/lasting.js';

import {Effect} from './effect.js';

export class LastingEffect extends Effect {
    constructor({
        effect,
        endEffect,
        useTriggerPlayer = false,
        until,
        triggerType,
        triggerTarget,
        hideDialog,
        condition,
        limit,
    }) {
        super(arguments[0]);

        this.effect = effect;
        this.endEffect = endEffect;
        this.useTriggerPlayer = useTriggerPlayer;
        this.triggerType = triggerType;
        this.triggerTarget = triggerTarget;
        this.until = until;
        this.hideDialog = hideDialog;
        this.condition = condition;
        this.limit = limit;
    }
    async execute(params) {
        const {
            effect,
            endEffect,
            ability,
            triggerType,
            triggerTarget,
            useTriggerPlayer,
        } = this;
        const until = this.until ?? TIME_PHASE;
        const {player} = params;

        if (!effect && !endEffect) {
            throw new Error('Un efecto lasting requiere un efecto o una limpieza al expirar.');
        }

        let lastingTriggerCard = ability.card;
        if (triggerTarget) {
            const triggerCards = this.validTarget.getValidTarget({
                ...params,
                ability,
                effect: this,
                target: triggerTarget,
            });
            if (triggerCards.length !== 1) {
                throw new Error(
                    'El objetivo de expiración de un efecto lasting debe resolver a una sola carta.'
                );
            }

            const [triggerCard] = triggerCards;
            if (typeof triggerCard.initTriggers !== 'function' ||
                typeof triggerCard.removeLastingTriggers !== 'function') {
                throw new TypeError(
                    'El objetivo de expiración de un efecto lasting debe ser una carta de juego.'
                );
            }

            lastingTriggerCard = triggerCard;
        }

        const lasting = new Lasting({
            match: this.match,
            until,
            effect,
            endEffect,
            useTriggerPlayer,
            condition: this.condition,
            player,
            card: ability.card,
            triggerCard: lastingTriggerCard,
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
                condition: this.condition,
                limit: this.limit,
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