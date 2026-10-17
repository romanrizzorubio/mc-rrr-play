import {DIALOG_DISCARD_HAND, RESOURCE_WILD} from 'mc-shared';

import {DiscardFromHandEffect} from './discard-from-hand-effect.js';
import {Effect} from './effect.js';
import {checkCondition} from '../engine/utils.js';
import {findResourceAssignment} from '../utils/find-resource-assignment.js';

export class SelectDiscardToFindCardEffect extends Effect {
    constructor({
        count = 1,
        showDialog = true,
        upTo = true,
        cardCondition,
        resourceRequirements = [],
        resourceTypes,
    }) {
        super(arguments[0]);

        this.count = count;
        this.showDialog = showDialog;
        this.upTo = upTo;
        this.cardCondition = cardCondition;
        this.resourceRequirements = resourceRequirements;
        this.resourceTypes = resourceTypes;

        this.cards = [];
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.cards = [];
    }
    getEligibleCards(player) {
        return player.hand.cards.filter(card =>
            !this.cardCondition || checkCondition(card, this.cardCondition));
    }
    async getCount(params) {
        const count = this.paramsCalc ?
            await this.calculate(params) :
            this.count;
        if (!Number.isSafeInteger(count) || count < 0) {
            throw new Error('SelectDiscardToFindCardEffect count must be a non-negative integer.');
        }

        return count;
    }
    async getResourceRequirements(params, player) {
        if (!this.resourceTypes?.length) {
            return this.resourceRequirements.map(requirement =>
                requirement.slice());
        }

        const count = await this.getCount(params);
        const availableIconCount = this.getEligibleCards(player).reduce(
            (sum, card) => sum + (card.resources || []).filter(resource =>
                resource === RESOURCE_WILD ||
                    this.resourceTypes.includes(resource)
            ).length,
            0
        );

        return Array.from({
            length: Math.min(count, availableIconCount),
        }, () => this.resourceTypes);
    }
    async canRun(params) {
        if (!await super.canRun(params)) {
            return false;
        }

        const targets = (await this.getValidTarget(params)).flat(Infinity);
        if (this.resourceRequirements.length || this.resourceTypes?.length) {
            return this.promisesSequentialSome(targets, async target => {
                const requirements = await this.getResourceRequirements(
                    params,
                    target
                );

                return requirements.length > 0 && Boolean(
                    findResourceAssignment(
                        this.getEligibleCards(target),
                        requirements
                    )
                );
            });
        }

        const count = await this.getCount(params);

        return count > 0 && targets.some(target =>
            this.getEligibleCards(target).length > 0);
    }
    getCostPaymentEffects(params) {
        return this.shouldPromptForPayment(params) ? [this] : [];
    }
    shouldPromptForPayment(_params, session) {
        const excludedCardIds = session?.getExcludedCardIds() || new Set();

        return this.selectedTarget.hand.cards.some(card =>
            !excludedCardIds.has(card.id));
    }
    getCostPaymentTitle() {
        const cards = this.count === 1 ? '1 carta' : `${this.count} cartas`;

        return this.title || `Descartar hasta ${cards} de la mano`;
    }
    async preparePayment(params, session) {
        const {selectedTarget, count} = this;
        const excludedCardIds = session.getExcludedCardIds();
        const cards = selectedTarget.hand.cards.filter(card =>
            !excludedCardIds.has(card.id));

        if (!cards.length) {
            return {
                cards: [],
                generators: [],
                hand: [],
            };
        }

        const response = await this.openDialog({
            dialogType: DIALOG_DISCARD_HAND,
            data: {
                count,
                upTo: true,
                ...(this.title ? {instruction: this.title} : {}),
                cards: cards.map(card => card.toObj(params)),
            },
        });
        if (!response) {
            return undefined;
        }

        const selected = response.selected || [];
        const selectedCards = selected.map(selectedCard => {
            const card = cards.find(candidate => candidate.id === selectedCard.id);
            if (!card) {
                throw new Error('La selección de cartas para descartar no es válida.');
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
        if ((this.resourceRequirements.length || this.resourceTypes?.length) &&
            !params.costPaymentSession) {
            return this.executeResourceRequirements(params);
        }

        let selectedCards;
        if (params.costPaymentSession) {
            selectedCards = params.costPaymentSession.hasPayment(this) ?
                params.costPaymentSession.getPayment(this).cards :
                [];
        } else {
            const eligibleCards = this.getEligibleCards(selectedTarget);
            const count = Math.min(await this.getCount(params), eligibleCards.length);
            if (!count) {
                return;
            }

            const response = await this.openDialog({
                dialogType: DIALOG_DISCARD_HAND,
                data: {
                    count,
                    upTo: this.upTo,
                    ...(this.title ? {instruction: this.title} : {}),
                    cards: eligibleCards.map(card =>
                        card.toObj(arguments[0])),
                },
            });
            selectedCards = response?.selected;

            if (!this.upTo && selectedCards?.length !== count) {
                throw new Error('SelectDiscardToFindCardEffect requires the selected discard count.');
            }
        }

        if (selectedCards) {
            this.cards = selectedCards.map(card =>
                typeof card === 'string' ?
                    selectedTarget.hand.cards.find(c => c.id === card) :
                    selectedTarget.hand.cards.find(c => c.id === card.id) || card);

            const discardFromHandEffect = new DiscardFromHandEffect({
                match: this.match,
            });

            await this.promisesSequential(this.cards, async card => {
                discardFromHandEffect.selectedTarget = card;

                await discardFromHandEffect.runEffect(params);
            });
        }
    }
    async executeResourceRequirements(params) {
        const {selectedTarget} = this;
        const remainingRequirements = await this.getResourceRequirements(
            params,
            selectedTarget
        );
        let eligibleCards = this.getEligibleCards(selectedTarget);
        this.cards = [];

        while (remainingRequirements.length) {
            const candidates = eligibleCards.filter(card =>
                findResourceAssignment(
                    eligibleCards,
                    remainingRequirements,
                    card
                ));
            if (!candidates.length) {
                throw new Error('SelectDiscardToFindCardEffect resource requirements changed during resolution.');
            }

            let selectedCard = candidates[0];
            if (candidates.length > 1) {
                const remainingIconCount = remainingRequirements.length;
                const iconLabel = remainingIconCount === 1 ?
                    'icono de recurso' :
                    'iconos de recursos';
                const response = await this.openDialog({
                    dialogType: DIALOG_DISCARD_HAND,
                    subtitle: this.resourceTypes?.length ?
                        'Cada icono de recurso impreso cuenta por separado.' :
                        undefined,
                    data: {
                        ...(this.resourceTypes?.length ? {
                            instruction: `Descarta ${remainingIconCount} ${iconLabel}.`,
                        } : this.title ? {
                            instruction: this.title,
                        } : {}),
                        count: 1,
                        upTo: false,
                        cards: candidates.map(card => card.toObj(params)),
                    },
                });
                const selectedId = response?.selected?.[0]?.id;
                selectedCard = candidates.find(card => card.id === selectedId);
                if (!selectedCard) {
                    throw new Error('SelectDiscardToFindCardEffect resource selection is invalid.');
                }
            }

            const assignment = findResourceAssignment(
                eligibleCards,
                remainingRequirements,
                selectedCard
            );
            const coveredRequirements = new Set(assignment
                .filter(icon => icon.card === selectedCard)
                .map(icon => icon.requirementIndex));
            if (!coveredRequirements.size) {
                throw new Error('SelectDiscardToFindCardEffect selected card does not satisfy a resource requirement.');
            }

            this.cards.push(selectedCard);
            remainingRequirements.splice(0, remainingRequirements.length,
                ...remainingRequirements.filter((_requirement, index) =>
                    !coveredRequirements.has(index)));
            eligibleCards = eligibleCards.filter(card => card !== selectedCard);

            const discardFromHandEffect = new DiscardFromHandEffect({
                match: this.match,
            });
            discardFromHandEffect.selectedTarget = selectedCard;
            await discardFromHandEffect.runEffect(params);
        }
    }
}
