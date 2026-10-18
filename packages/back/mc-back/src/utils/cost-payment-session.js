import {
    DIALOG_LIST,
    RESOURCE_WILD,
} from 'mc-shared';
import {
    getResourceIcons,
    normalizeResourceRequirements,
    resourceSatisfiesRequirement,
} from './resource-requirements.js';

export class CostPaymentSession {
    constructor() {
        this.committing = false;
        this.executionParams = new Map();
        this.preparedEffects = new Map();
        this.skippedEffects = new Set();
        this.stagedPayments = new Map();
        this.excludedCardIds = new Set();
        this.remainingResourcesByCard = new Map();
        this.committedHandCardIds = new Set();
        this.deferredResponses = [];
        this.requireAllCosts = false;
    }
    deferResponse(callback) {
        this.deferredResponses.push(callback);
    }
    getExcludedCardIds() {
        return new Set(this.excludedCardIds);
    }
    getResourcePaymentExcludedCardIds() {
        const excludedCardIds = new Set(this.excludedCardIds);

        this.remainingResourcesByCard.forEach((resources, cardId) => {
            if (resources.length) {
                excludedCardIds.delete(cardId);
            }
        });

        return excludedCardIds;
    }
    getRemainingResources() {
        return new Map([...this.remainingResourcesByCard].map(([cardId, resources]) =>
            [cardId, resources.slice()]));
    }
    getPreparedEffect(effect) {
        return this.preparedEffects.get(effect);
    }
    getExecutionParams(effect) {
        return this.executionParams.get(effect);
    }
    getPayment(effect) {
        if (!this.stagedPayments.has(effect)) {
            throw new Error('No se preparó el pago del efecto de coste.');
        }

        const payment = this.stagedPayments.get(effect);
        this.stagedPayments.delete(effect);

        const hand = (payment.hand || []).filter(card => {
            if (this.committedHandCardIds.has(card.id)) {
                return false;
            }

            this.committedHandCardIds.add(card.id);

            return true;
        });

        return {
            ...payment,
            hand,
        };
    }
    getPaymentResourceRequirements(effect, payment) {
        if (Array.isArray(payment.resourceRequirements)) {
            return payment.resourceRequirements;
        }
        if (Array.isArray(effect.resources)) {
            return effect.resources;
        }
        if (effect.resourceCost) {
            return [
                ...effect.resourceCost.getRequiredResources(),
                ...effect.resourceCost.requirement,
            ];
        }
    }
    getPaymentResourceUnits(payment, params) {
        const cardToPay = payment.cardToPay || params.card;
        const availableUnits = [];
        const allowWildConversion = payment.allowWildConversion !== false;

        (payment.hand || []).forEach(card => {
            const resources = this.remainingResourcesByCard.get(card.id) || [];
            resources.forEach((resource, index) => {
                availableUnits.push({
                    cardId: card.id,
                    index,
                    resource,
                });
            });
        });

        (payment.generators || []).forEach(generator => {
            (generator.abilities || [])
                .filter(ability => ability.isResource)
                .forEach(ability => {
                    const resources = typeof ability.getGeneratedResources === 'function' ?
                        ability.getGeneratedResources({
                            player: generator.controller || generator.owner,
                            card: generator,
                            cardToPay,
                        }) :
                        ability.resources || (ability.resource ? [ability.resource] : []);
                    resources.forEach(resource =>
                        availableUnits.push({resource}));
                });
        });

        const usedUnitIndexes = new Set();

        return (payment.resources || []).map(resource => {
            const unitIndex = availableUnits.findIndex((unit, index) =>
                !usedUnitIndexes.has(index) &&
                (unit.resource === resource ||
                    allowWildConversion && unit.resource === RESOURCE_WILD));
            if (unitIndex < 0) {
                throw new Error('El pago contiene un recurso que no está disponible.');
            }

            usedUnitIndexes.add(unitIndex);

            return {
                ...availableUnits[unitIndex],
                resource,
            };
        });
    }
    assignPaymentResources(
        units,
        requirements,
        {allowWildConversion = true} = {}
    ) {
        const normalizedRequirements = normalizeResourceRequirements(
            requirements
        );
        const findAssignment = (requirementIndex, assigned, usedUnitIndexes) => {
            if (requirementIndex === normalizedRequirements.length) {
                return assigned;
            }

            const requirement = normalizedRequirements[requirementIndex];
            for (let index = 0; index < units.length; index++) {
                if (usedUnitIndexes.has(index)) {
                    continue;
                }

                const {resource} = units[index];
                if (!resourceSatisfiesRequirement(
                    resource,
                    requirement,
                    {allowWildConversion}
                )) {
                    continue;
                }

                const assignment = findAssignment(
                    requirementIndex + 1,
                    [...assigned, units[index]],
                    new Set([...usedUnitIndexes, index])
                );
                if (assignment) {
                    return assignment;
                }
            }
        };

        return findAssignment(0, [], new Set());
    }
    consumePaymentResources(effect, payment, params) {
        const isResourcePayment =
            Array.isArray(payment.resourceRequirements) ||
            Array.isArray(effect.resources) ||
            typeof effect.resources === 'number' ||
            Boolean(effect.resourceCost);
        if (!isResourcePayment) {
            return [];
        }
        if (!Array.isArray(payment.resources)) {
            throw new TypeError('El pago de recursos no contiene los recursos pagados.');
        }

        const units = this.getPaymentResourceUnits(payment, params);
        const requirements = this.getPaymentResourceRequirements(effect, payment);
        const usedUnits = requirements ?
            this.assignPaymentResources(
                units,
                requirements,
                {
                    allowWildConversion: payment.allowWildConversion !== false,
                }
            ) :
            units;

        if (!usedUnits) {
            throw new Error('El pago no satisface los requisitos de recursos.');
        }

        const usedIndexesByCard = new Map();
        usedUnits.forEach(unit => {
            if (!unit.cardId) {
                return;
            }

            const indexes = usedIndexesByCard.get(unit.cardId) || [];
            indexes.push(unit.index);
            usedIndexesByCard.set(unit.cardId, indexes);
        });
        usedIndexesByCard.forEach((indexes, cardId) => {
            const remainingResources = this.remainingResourcesByCard.get(cardId);
            indexes.sort((left, right) => right - left)
                .forEach(index => remainingResources.splice(index, 1));
        });

        return usedUnits;
    }
    hasPayment(effect) {
        return this.stagedPayments.has(effect);
    }
    isPrepared(effect) {
        return this.preparedEffects.has(effect);
    }
    isSkipped(effect) {
        return this.skippedEffects.has(effect);
    }
    prepareEffect(effect, effectParams, triggersParams) {
        this.preparedEffects.set(effect, {effectParams, triggersParams});
    }
    prepareExecutionParams(effect, params) {
        this.executionParams.set(effect, params);
    }
    stagePayment(effect, payment, params = {}) {
        (payment.generators || []).forEach(card =>
            this.excludedCardIds.add(card.id));
        (payment.reservedCards || []).forEach(card =>
            this.excludedCardIds.add(card.id));

        const cardToPay = payment.cardToPay || params.card;
        const isResourcePayment =
            Array.isArray(payment.resourceRequirements) ||
            Array.isArray(effect.resources) ||
            typeof effect.resources === 'number' ||
            Boolean(effect.resourceCost);
        const hand = payment.hand || [];
        hand.forEach(card => {
            this.excludedCardIds.add(card.id);

            if (isResourcePayment &&
                !this.remainingResourcesByCard.has(card.id)) {
                const resources = getResourceIcons(card, {
                    printed: payment.printedResources === true,
                    cardToPay,
                });
                this.remainingResourcesByCard.set(card.id, resources.slice());
            }
        });

        const usedUnits = this.consumePaymentResources(effect, payment, params);
        this.stagedPayments.set(effect, isResourcePayment ? {
            ...payment,
            resources: usedUnits.map(unit => unit.resource),
        } : payment);
    }
    skipEffect(effect) {
        this.skippedEffects.add(effect);
        effect.resolved = false;
        effect.fullResolved = false;
        effect.paymentCancelled = false;
        effect.effects?.forEach(child => this.skipEffect(child));
    }
    takePreparedEffect(effect) {
        const prepared = this.preparedEffects.get(effect);
        this.preparedEffects.delete(effect);

        return prepared;
    }
    async resolve(effect, params, {requireAllCosts = false} = {}) {
        this.requireAllCosts = requireAllCosts;
        const effectParams = {
            ...params,
            effect,
            costPaymentSession: this,
            ...(requireAllCosts ? {matchAll: true} : {}),
        };

        if (!await effect.prepareCost(effectParams, this)) {
            return {blocked: true, cancelled: false, resolved: false};
        }

        while (true) {
            const costPaymentEffects = await effect.getCostPaymentEffects(effectParams);
            const pendingPayments = costPaymentEffects
                .filter(paymentEffect =>
                    this.isPrepared(paymentEffect) &&
                    !this.isSkipped(paymentEffect) &&
                    !this.hasPayment(paymentEffect));
            const effectsWithDialogs = [];
            for (const paymentEffect of pendingPayments) {
                if (await paymentEffect.shouldPromptForPayment(effectParams, this)) {
                    effectsWithDialogs.push(paymentEffect);
                }
            }
            if (!effectsWithDialogs.length) {
                break;
            }

            let paymentEffect = effectsWithDialogs[0];
            if (effectsWithDialogs.length > 1) {
                paymentEffect = await this.choosePaymentEffect(
                    effect,
                    effectsWithDialogs,
                    effectParams
                );
            }
            if (!paymentEffect) {
                this.discardDeferredResponses();
                return {blocked: false, cancelled: true, resolved: false};
            }

            const payment = await paymentEffect.preparePayment(effectParams, this);
            if (!payment) {
                this.discardDeferredResponses();
                return {blocked: false, cancelled: true, resolved: false};
            }
            this.stagePayment(paymentEffect, payment, effectParams);
        }

        if (!await effect.canRun(effectParams)) {
            this.discardDeferredResponses();
            return {blocked: true, cancelled: false, resolved: false};
        }

        this.committing = true;
        try {
            await effect.runEffect(effectParams);
        } catch (error) {
            this.discardDeferredResponses();
            throw error;
        } finally {
            this.committing = false;
        }

        if (effect.paymentCancelled ||
            (requireAllCosts && !effect.fullResolved)) {
            const cancelled = effect.paymentCancelled;
            this.discardDeferredResponses();
            return {
                blocked: !cancelled,
                cancelled,
                resolved: false,
            };
        }

        await this.resolveResponses();

        return {
            blocked: false,
            cancelled: false,
            effectParams,
            resolved: true,
        };
    }
    async choosePaymentEffect(effect, paymentEffects, params) {
        const card = params.cardToPay ||
            params.playCardEffect?.card ||
            params.card ||
            params.ability?.card ||
            effect.ability?.card;
        const cardData = typeof card?.toObj === 'function' ?
            card.toObj(params) :
            card;

        const response = await effect.openDialog({
            dialogType: DIALOG_LIST,
            showCancel: true,
            hideOk: true,
            title: '¿Qué coste quieres pagar ahora?',
            data: {
                ...(cardData ? {card: cardData} : {}),
                options: paymentEffects.map((paymentEffect, id) => ({
                    id,
                    text: paymentEffect.getCostPaymentTitle(params),
                })),
            },
        });
        const selectedIndex = paymentEffects.findIndex((_paymentEffect, index) =>
            index === response?.selected?.id);

        if (selectedIndex < 0) {
            if (!response) {
                return undefined;
            }

            throw new Error('La selección del coste no es válida.');
        }

        return paymentEffects[selectedIndex];
    }
    discardDeferredResponses() {
        this.deferredResponses = [];
    }
    async resolveResponses() {
        this.committing = false;

        while (this.deferredResponses.length) {
            const callback = this.deferredResponses.shift();
            await callback();
        }
    }
}
