import {
    DIALOG_REVEAL_CARDS,
    PRIORITY_CONSTANT,
    PRIORITY_FORCED_INTERRUPT,
    PRIORITY_INTERRUPT,
    TRIGGER_BOOST_ICONS_COUNTED,
} from 'mc-shared';

import {Effect} from './effect.js';
import {path} from '../engine/utils.js';

export class CountBoostIconsEffect extends Effect {
    constructor({
        card: cardSource,
        effectDefinition,
        showDialog = true,
    }) {
        super(arguments[0]);

        this.cardSource = cardSource;
        this.effectDefinition = effectDefinition;
        this.showDialog = showDialog;
        this.card = undefined;
        this.boostValue = 0;
        this.value = 0;
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.card = undefined;
        this.boostValue = 0;
        this.value = 0;
    }
    getCard(params) {
        const card = typeof this.cardSource === 'string' ?
            path(params, this.cardSource) :
            this.cardSource ?? this.selectedTarget ?? params.card;
        if (!card || typeof card !== 'object' || Array.isArray(card)) {
            throw new TypeError(
                'CountBoostIconsEffect requires one encounter card.'
            );
        }

        return card;
    }
    async showCountedCard(card, params, updated = false) {
        if (!this.showDialog) {
            return;
        }

        const cardData = card.toObj(params);
        await this.openPublicDialog({
            dialogType: DIALOG_REVEAL_CARDS,
            title: updated ?
                'Aumento actualizado' :
                'Carta cuyo Aumento se está contando',
            subtitle: updated ?
                `Se cuentan ${this.boostValue} iconos de Aumento.` :
                'Las interrupciones se resolverán antes de aplicar este recuento.',
            data: {
                cards: [{
                    ...cardData,
                    boost: this.boostValue,
                }],
            },
        }, params.player);
    }
    async countCurrentCard(card, params) {
        this.card = card;
        this.boostValue = card.boost ?? 0;
        await this.showCountedCard(card, params);

        const countWindow = {
            id: card.id,
            card,
            displayCard: card,
            boostValue: this.boostValue,
            cancelledBoostIcons: 0,
            countReplaced: false,
            countEffect: this,
            toTargetObj(params) {
                return this.toObj(params);
            },
            toObj(params) {
                return {
                    ...card.toObj(params),
                    id: card.id,
                    boost: this.boostValue,
                };
            },
            checkTrigger() {
                return !this.countReplaced;
            },
        };
        countWindow.boostCountWindows = [countWindow];
        const previousBoostValue = countWindow.boostValue;
        const triggerTypes = [TRIGGER_BOOST_ICONS_COUNTED];
        const triggerParams = {
            ...params,
            card,
            triggeredCard: card,
            countedCard: card,
            effect: countWindow,
            countEffect: this,
            showSingleTargetDialog: false,
        };
        await this.trigger(PRIORITY_CONSTANT, triggerTypes, triggerParams);
        if (await this.trigger(
            PRIORITY_FORCED_INTERRUPT,
            triggerTypes,
            triggerParams
        )) {
            await this.trigger(
                PRIORITY_INTERRUPT,
                triggerTypes,
                triggerParams
            );
        }

        this.boostValue = countWindow.boostValue;
        if (this.boostValue !== previousBoostValue) {
            await this.showCountedCard(
                countWindow.displayCard,
                params,
                true
            );
        }
        this.value = this.boostValue;

        return this.value;
    }
    async resolveCountEffect(card, value, params) {
        if (!this.effectDefinition) {
            return;
        }

        const effect = this.match.effectsFactory.parseEffect(
            this.effectDefinition
        );
        if (!effect) {
            throw new Error(
                'CountBoostIconsEffect could not create its nested effect.'
            );
        }

        effect.ability = this.ability;
        await effect.runEffect({
            ...params,
            card,
            countedCard: card,
            countedBoostIcons: value,
            boostIconCount: value,
            countEffect: this,
        });
    }
    async execute(params) {
        const card = this.getCard(params);
        const value = await this.countCurrentCard(card, params);

        await this.resolveCountEffect(card, value, params);
    }
}
