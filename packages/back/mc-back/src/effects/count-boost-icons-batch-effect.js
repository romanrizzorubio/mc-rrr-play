import {
    DIALOG_REVEAL_CARDS,
    PRIORITY_CONSTANT,
    PRIORITY_FORCED_INTERRUPT,
    PRIORITY_INTERRUPT,
    TRIGGER_BOOST_ICONS_COUNTED,
} from 'mc-shared';

import {Effect} from './effect.js';
import {path} from '../engine/utils.js';

export class CountBoostIconsBatchEffect extends Effect {
    constructor({
        cards: cardsSource,
        showDialog = true,
        interactionInstructions = '',
    }) {
        super(arguments[0]);

        this.cardsSource = cardsSource;
        this.showDialog = showDialog;
        this.interactionInstructions = interactionInstructions;
        this.cards = [];
        this.boostCountWindows = [];
        this.results = [];
        this.value = 0;
        this.selectedBoostCountWindow = undefined;
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.cards = [];
        this.boostCountWindows = [];
        this.results = [];
        this.value = 0;
        this.selectedBoostCountWindow = undefined;
    }
    getCards(params) {
        const cards = typeof this.cardsSource === 'string' ?
            path(params, this.cardsSource) :
            this.cardsSource;
        if (!Array.isArray(cards)) {
            throw new TypeError(
                'CountBoostIconsBatchEffect requires a cached card list.'
            );
        }

        return cards.slice();
    }
    createCountWindow(card) {
        const boostValue = card.boost ?? 0;
        if (!Number.isFinite(boostValue)) {
            throw new TypeError(
                'CountBoostIconsBatchEffect requires finite boost values.'
            );
        }

        return {
            id: card.id,
            card,
            boostValue,
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
    }
    checkTrigger() {
        return !this.boostCountWindows.length ||
            this.boostCountWindows.some(window => !window.countReplaced);
    }
    async showCountedCards(params, triggerTypes, triggerParams) {
        if (!this.showDialog) {
            return;
        }

        const availableInterrupts = this.interactionInstructions ?
            await this._getTriggers(
                triggerTypes,
                PRIORITY_INTERRUPT,
                triggerParams
            ) :
            [];
        const hasAvailableInterrupt = availableInterrupts.length > 0;
        const sourceCardName = this.ability?.card?.name;
        const subtitle = [
            sourceCardName ?
                `Se descartan por ${sourceCardName}.` :
                undefined,
            'En el orden en que se descartarán, desde la carta superior.',
            hasAvailableInterrupt ? this.interactionInstructions : undefined,
        ].filter(Boolean).join(' ');

        const response = await this.openDialog({
            dialogType: DIALOG_REVEAL_CARDS,
            title: 'Cartas que se van a descartar',
            subtitle,
            data: {
                cards: this.cards.map(card => card.toObj(params)),
                selectable: hasAvailableInterrupt,
            },
        });
        if (response?.selected && !hasAvailableInterrupt) {
            throw new Error(
                'CountBoostIconsBatchEffect received an unexpected card selection.'
            );
        }
        const selectedCard = response?.selected?.id !== undefined ?
            this.cards.find(card => card.id === response.selected.id) :
            undefined;
        if (response?.selected && !selectedCard) {
            throw new Error(
                'CountBoostIconsBatchEffect received an unknown card selection.'
            );
        }

        if (selectedCard) {
            this.selectedBoostCountWindow = this.boostCountWindows.find(window =>
                window.card === selectedCard);
        }
    }
    async execute(params) {
        this.selectedBoostCountWindow = undefined;
        this.cards = this.getCards(params);
        this.boostCountWindows = this.cards.map(card =>
            this.createCountWindow(card));
        this.results = [];
        this.value = 0;

        if (!this.boostCountWindows.length) {
            return;
        }

        const [countedCard] = this.cards.length === 1 ?
            this.cards :
            [];
        const triggerTypes = [TRIGGER_BOOST_ICONS_COUNTED];
        const triggerParams = {
            ...params,
            ...(this.selectedBoostCountWindow ? {
                selectedTriggerTarget: this.selectedBoostCountWindow,
            } : {}),
            card: countedCard,
            triggeredCard: countedCard,
            countedCard,
            countedCards: this.cards,
            effect: this,
            countEffect: this,
            showSingleTargetDialog: true,
        };

        await this.showCountedCards(params, triggerTypes, triggerParams);
        if (this.selectedBoostCountWindow) {
            triggerParams.selectedTriggerTarget =
                this.selectedBoostCountWindow;
        }

        await this.trigger(
            PRIORITY_CONSTANT,
            triggerTypes,
            triggerParams
        );
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

        this.results = this.boostCountWindows.map(window => ({
            card: window.card,
            effect: window,
            value: window.boostValue,
        }));
        this.value = this.results.reduce(
            (total, {value}) => total + value,
            0
        );
    }
}
