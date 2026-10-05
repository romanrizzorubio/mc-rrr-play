import {DIALOG_LIST} from 'mc-shared';

export class CostPaymentSession {
    constructor() {
        this.committing = false;
        this.executionParams = new Map();
        this.preparedEffects = new Map();
        this.skippedEffects = new Set();
        this.stagedPayments = new Map();
        this.excludedCardIds = new Set();
        this.deferredResponses = [];
        this.requireAllCosts = false;
    }
    deferResponse(callback) {
        this.deferredResponses.push(callback);
    }
    getExcludedCardIds() {
        return new Set(this.excludedCardIds);
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

        return payment;
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
    stagePayment(effect, payment) {
        this.stagedPayments.set(effect, payment);
        payment.generators
            .concat(payment.hand, payment.reservedCards || [])
            .forEach(card => {
                this.excludedCardIds.add(card.id);
            });
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
            const pendingPayments = effect.getCostPaymentEffects(effectParams)
                .filter(paymentEffect =>
                    this.isPrepared(paymentEffect) &&
                    !this.isSkipped(paymentEffect) &&
                    !this.hasPayment(paymentEffect));
            const effectsWithDialogs = pendingPayments.filter(paymentEffect =>
                paymentEffect.shouldPromptForPayment(effectParams, this));
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
            this.stagePayment(paymentEffect, payment);
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
        const response = await effect.openDialog({
            dialogType: DIALOG_LIST,
            showCancel: true,
            hideOk: true,
            title: '¿Qué coste quieres pagar ahora?',
            data: {
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
