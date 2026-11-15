import {DiscardFromGameEffect} from './discard-from-game-effect.js';
import {DIALOG_LIST, TRIGGER_THIS_COUNTERS_REMOVED} from 'mc-shared';
import {Effect} from './effect.js';

export class RemoveCountersEffect extends Effect {
    constructor({
        count,
        upTo = false,
        allowZero = false,
    }) {
        super(arguments[0]);

        this.count = count;
        this.upTo = upTo;
        this.allowZero = allowZero;
        if (typeof this.allowZero !== 'boolean') {
            throw new TypeError('RemoveCountersEffect allowZero must be a boolean.');
        }
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.removedCounters = 0;
        this.selectedCount = undefined;
    }
    async getCount(params) {
        const count = this.paramsCalc ?
            await this.calculate(params) :
            this.count;

        if (!Number.isFinite(count) || count < 0) {
            throw new Error('RemoveCountersEffect requires a non-negative counter count.');
        }
        if (this.upTo && !Number.isSafeInteger(count)) {
            throw new Error('RemoveCountersEffect upTo requires an integer counter count.');
        }

        return count;
    }
    async getMaxSelectableCount(params, counters = Infinity) {
        let paymentTargetLimit = params.paymentTargetLimit;
        if (paymentTargetLimit === undefined && this.upTo) {
            paymentTargetLimit =
                await this.ability?.costs?.getPaymentTargetLimit?.({
                    ...params,
                    ability: this.ability ?? params.ability,
                    abilityEffect: this.ability?.effect,
                });
        }

        return Math.min(
            this.count,
            counters,
            paymentTargetLimit ?? Infinity
        );
    }
    filterTarget(card, params) {
        const isFixedCost = (this.isCost || params?.isCost) && !this.upTo;
        const hasAvailableCounters = isFixedCost ?
            card.counters >= this.count :
            this.allowZero || card.counters > 0;

        return hasAvailableCounters &&
            super.filterTarget.apply(this, arguments);
    }
    async canRun(params) {
        this.count = await this.getCount(params);

        const maxSelectableCount = this.upTo ?
            await this.getMaxSelectableCount(params) :
            this.count;

        return this.count > 0 &&
            (this.allowZero || maxSelectableCount > 0) &&
            super.canRun(params);
    }
    async prepare(params) {
        this.count = await this.getCount(params);
        await super.prepare(params);
    }
    isResolved() {
        return this.removedCounters > 0;
    }
    isFullResolved() {
        return this.removedCounters === (
            this.upTo ? this.selectedCount : this.count
        );
    }
    getTriggersEnds(params) {
        return super.getTriggersEnds(params)
            .concat(this.removedCounters > 0 ?
                [TRIGGER_THIS_COUNTERS_REMOVED] :
                []);
    }
    async selectCounterCount(params, maxCount) {
        if (!this.upTo) {
            return maxCount;
        }
        if (maxCount < 1) {
            throw new Error('RemoveCountersEffect upTo requires at least one available counter.');
        }

        const {player} = params;
        const card = this.ability?.card ?? params.card;
        if (!player) {
            throw new Error('RemoveCountersEffect upTo requires a player.');
        }
        const cardData = typeof card?.toObj === 'function' ?
            card.toObj(params) :
            undefined;
        const response = await this.openDialog({
            dialogType: DIALOG_LIST,
            hideOk: true,
            showCancel: true,
            targetPlayer: player.id || player.userId || player.name,
            targetPlayerName: player.name,
            title: this.dialogTitle || 'Elige cuántos contadores quieres quitar',
            data: {
                ...(cardData ? {card: cardData} : {}),
                    options: Array.from({length: maxCount}, (_value, index) => {
                        const count = index + 1;

                        return {
                            id: count,
                            text: `${count} ${count === 1 ? 'contador' : 'contadores'}`,
                        };
                    }),
                },
        });
        const selected = response?.selected;
        if (selected === null || selected === undefined) {
            this.paymentCancelled = true;

            return undefined;
        }

        const selectedCount = selected.id;
        if (!Number.isSafeInteger(selectedCount) ||
                selectedCount < 1 ||
                selectedCount > maxCount) {
            throw new Error('RemoveCountersEffect received an invalid counter count.');
        }

        return selectedCount;
    }
    async execute(params) {
        const {selectedTarget} = this;
        const counters = selectedTarget.counters ?? 0;
        if (!Number.isSafeInteger(counters) || counters < 0) {
            throw new Error('RemoveCountersEffect requires a non-negative counter total.');
        }
        const maxCount = await this.getMaxSelectableCount(params, counters);
        const selectedCount = this.upTo ?
            await this.selectCounterCount(params, maxCount) :
            this.count;
        if (selectedCount === undefined) {
            return;
        }
        this.selectedCount = selectedCount;

        this.removedCounters = Math.min(
            this.selectedCount,
            counters
        );
        if (!this.removedCounters) {
            return;
        }

        selectedTarget.removeCounters(this.removedCounters);

        await selectedTarget.refresh();

        if (selectedTarget.counters < 1 && selectedTarget.uses) {
            const discardFromGameEffect = new DiscardFromGameEffect({
                selectedTarget,
                match: this.match,
            });

            await discardFromGameEffect.runEffect(params);
        }
    }
}