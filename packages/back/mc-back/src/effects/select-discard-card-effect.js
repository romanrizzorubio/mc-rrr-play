import {DIALOG_DISCARD_HAND} from 'mc-shared';

import {DiscardFromHandEffect} from './discard-from-hand-effect.js';
import {Effect} from './effect.js';
import {checkCondition} from '../engine/utils.js';
import {
    filterTargetCandidates,
    splitTargetCondition,
} from '../utils/target-condition-utils.js';

export class SelectDiscardCardEffect extends Effect {
    static getTargetParams(effect, params) {
        return {
            ...params,
            ability: effect.ability,
            effect,
            source: effect.source ?? params.source,
            target: effect.target,
        };
    }
    static getTargetCandidates(effect, params) {
        return effect.validTarget.getValidTarget(
            SelectDiscardCardEffect.getTargetParams(effect, params)
        );
    }
    static resetInvalidSelectedTarget(effect, params) {
        const {selectedTarget} = effect;
        if (!selectedTarget) {
            return true;
        }

        const selectedTargets = Array.isArray(selectedTarget) ?
            selectedTarget :
            [selectedTarget];
        const validTargets = effect.validTarget.resolveSelectedTargets(
            selectedTarget,
            SelectDiscardCardEffect.getTargetParams(effect, params)
        );
        if (validTargets.length === selectedTargets.length &&
            validTargets.every(Boolean)) {
            effect.selectedTarget = Array.isArray(selectedTarget) ?
                validTargets :
                validTargets[0];

            return true;
        }

        if (params.preselectedEffectTargets?.has(effect)) {
            return false;
        }

        effect.selectedTarget = undefined;

        return true;
    }
    constructor({
        count = 1,
        showDialog = true,
        countFromHand = false,
        upTo = false,
        minCount = 1,
        filter = {},
    }) {
        super(arguments[0]);

        this.count = count;
        this.showDialog = showDialog;
        this.countFromHand = countFromHand;
        this.upTo = upTo;
        this.minCount = minCount;
        this.cardFilter = filter;

        this.cards = [];
    }
    async prepare(params) {
        if (!SelectDiscardCardEffect.resetInvalidSelectedTarget(this, params)) {
            return;
        }

        return super.prepare({
            ...params,
            selectCount: this.selectCount,
        });
    }
    getEligibleCards(player) {
        const {condition, selectionConditions} =
            splitTargetCondition(this.cardFilter);
        const cards = player.hand.cards.filter(card =>
            checkCondition(card, condition));

        return filterTargetCandidates(cards, selectionConditions);
    }
    async resolveParams(params) {
        const resolvedParams = await super.resolveParams(params);
        if (!this.paramsCalc) {
            return resolvedParams;
        }

        const count = await this.calculate(resolvedParams);
        if (!Number.isSafeInteger(count) || count < 0) {
            throw new Error('El número de cartas descartadas debe ser un entero no negativo.');
        }

        return {
            ...resolvedParams,
            selectCount: count,
        };
    }
    async canRun(params) {
        const resolvedParams = await this.resolveParams(params);
        if (!SelectDiscardCardEffect.resetInvalidSelectedTarget(
            this,
            resolvedParams
        )) {
            return false;
        }
        if (!await super.canRun(resolvedParams)) {
            return false;
        }

        const count = resolvedParams.selectCount ?? this.count;
        const targets = this.selectedTarget ?
            (Array.isArray(this.selectedTarget) ?
                this.selectedTarget :
                [this.selectedTarget]) :
            SelectDiscardCardEffect.getTargetCandidates(this, resolvedParams);

        return this.upTo || this.countFromHand ||
            targets.some(target =>
                count <= this.getEligibleCards(target).length);
    }
    getCostPaymentEffects(params) {
        return this.shouldPromptForPayment(params) ? [this] : [];
    }
    shouldPromptForPayment(params) {
        return (params.selectCount ?? this.count) > 0;
    }
    getCostPaymentTitle() {
        return this.title || 'Descartar cartas de la mano';
    }
    async preparePayment(params, session) {
        const {selectedTarget} = this;
        const excludedCardIds = session.getExcludedCardIds();
        const cards = this.getEligibleCards(selectedTarget).filter(card =>
            !excludedCardIds.has(card.id));
        const countFromHand = this.countFromHand ? cards.length : undefined;
        const preparedParams = session.getPreparedEffect(this).effectParams;
        const count = countFromHand ??
            params.selectCount ??
            preparedParams.selectCount ??
            this.count;
        const minCount = this.upTo ? this.minCount : count;
        if (cards.length < minCount) {
            return undefined;
        }

        const response = await this.openDialog({
            dialogType: DIALOG_DISCARD_HAND,
            showCancel: true,
            targetPlayer: params.player,
            title: this.title,
            data: {
                count,
                upTo: this.upTo,
                minCount,
                cards: cards.map(card => card.toObj(params)),
            },
        });
        if (!response) {
            return undefined;
        }

        const selected = response.selected || [];
        if (selected.length < minCount || selected.length > count) {
            throw new Error('La selección de descarte no es válida.');
        }

        const selectedCards = selected.map(selectedCard => {
            const card = cards.find(candidate => candidate.id === selectedCard.id);
            if (!card) {
                throw new Error('La selección de descarte no es válida.');
            }

            return card;
        });

        return {
            cards: selectedCards,
            generators: [],
            hand: selectedCards,
        };
    }
    async execute(params) {
        const {selectedTarget} = this;
        this.cards = [];

        if (params.costPaymentSession?.hasPayment(this)) {
            this.cards = params.costPaymentSession.getPayment(this).cards;
        } else {
            const count = params.selectCount ?? this.count;
            const eligibleCards = this.getEligibleCards(selectedTarget);
            const dialogCount = this.countFromHand ?
                eligibleCards.length :
                count;
            if (!this.upTo && count === 0) {
                return;
            }

            const response = await this.openDialog({
                dialogType: DIALOG_DISCARD_HAND,
                targetPlayer: params.player,
                title: this.title,
                data: {
                    count: dialogCount,
                    upTo: this.upTo,
                    minCount: this.minCount,
                    cards: eligibleCards.map(card => card.toObj(arguments[0]))
                },
            });

            const {selected} = response || {};

            if (selected) {
                this.cards = selected.map(card =>
                    eligibleCards.find(c => c.id === card.id));
            }
        }

        const discardFromHandEffect = new DiscardFromHandEffect({
            match: this.match,
        });

        await this.promisesSequential(this.cards, async card => {
            discardFromHandEffect.selectedTarget = card;

            await discardFromHandEffect.runEffect(params);
        });
    }
}