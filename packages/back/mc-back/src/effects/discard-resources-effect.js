import {
    RESOURCE_ANY,
} from 'mc-shared';

import {DiscardFromHandEffect} from './discard-from-hand-effect.js';
import {Effect} from './effect.js';
import {findResourceAssignment} from '../utils/find-resource-assignment.js';
import {
    getResourceIcons,
    normalizeResourceRequirements,
} from '../utils/resource-requirements.js';

export class DiscardResourcesEffect extends Effect {
    constructor({
        count,
        resourceRequirements = [],
        resources = [],
    }) {
        super(arguments[0]);

        if (resourceRequirements.length && resources.length) {
            throw new TypeError(
                'DiscardResourcesEffect accepts resourceRequirements or resources, not both.'
            );
        }

        this.count = count;
        this.resourceRequirements = resourceRequirements.length ?
            normalizeResourceRequirements(resourceRequirements) :
            normalizeResourceRequirements(resources);
        if (!this.resourceRequirements.length &&
            count !== undefined) {
            if (!Number.isSafeInteger(count) || count < 0) {
                throw new TypeError(
                    'DiscardResourcesEffect count must be a non-negative integer.'
                );
            }

            this.resourceRequirements = Array.from(
                {length: count},
                () => [RESOURCE_ANY]
            );
        }

        this.cards = [];
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.cards = [];
    }
    async getResourceRequirements(params) {
        if (!this.paramsCalc) {
            return this.resourceRequirements.map(requirement =>
                requirement.slice());
        }

        const count = await this.calculate(params);
        if (!Number.isSafeInteger(count) || count < 0) {
            throw new Error(
                'DiscardResourcesEffect count must be a non-negative integer.'
            );
        }

        return Array.from({length: count}, () => [RESOURCE_ANY]);
    }
    getEligibleCards(player, excludedCardIds = new Set()) {
        return player.hand.cards.filter(card =>
            !excludedCardIds.has(card.id) &&
            getResourceIcons(card, {printed: true}).length > 0
        );
    }
    async canRun(params) {
        if (!await super.canRun(params)) {
            return false;
        }

        const requirements = await this.getResourceRequirements(params);
        if (!requirements.length) {
            return false;
        }

        const targets = (await this.getValidTarget(params)).flat(Infinity);

        return targets.some(target => Boolean(
            findResourceAssignment(
                this.getEligibleCards(target),
                requirements,
                undefined,
                {allowWildConversion: false, printed: true}
            )
        ));
    }
    async getCostPaymentEffects(params) {
        const shouldPrompt = await this.shouldPromptForPayment(params);

        return shouldPrompt ? [this] : [];
    }
    async shouldPromptForPayment(params, session) {
        const requirements = await this.getResourceRequirements(params);
        const excludedCardIds = session?.getExcludedCardIds() || new Set();

        return requirements.length > 0 &&
            this.getEligibleCards(this.selectedTarget, excludedCardIds).length > 0;
    }
    getCostPaymentTitle() {
        const count = this.resourceRequirements.length || this.count || 0;
        const iconLabel = count === 1 ?
            'icono de recurso' :
            'iconos de recursos';

        return this.title || `Descarta ${count} ${iconLabel} de tu mano`;
    }
    isValidPayment(payment, cards, requirements) {
        if (!Array.isArray(payment.resources)) {
            return Boolean(findResourceAssignment(
                cards,
                requirements,
                undefined,
                {allowWildConversion: false, printed: true}
            ));
        }

        const availableResources = cards.flatMap(card =>
            getResourceIcons(card, {printed: true}));
        const remainingResources = availableResources.slice();
        const resources = payment.resources;
        const allResourcesPrinted = resources.every(resource => {
            const index = remainingResources.indexOf(resource);
            if (index < 0) {
                return false;
            }

            remainingResources.splice(index, 1);

            return true;
        });
        if (!allResourcesPrinted) {
            return false;
        }

        return Boolean(findResourceAssignment(
            [{resources}],
            requirements,
            undefined,
            {allowWildConversion: false, printed: true}
        ));
    }
    async preparePayment(params, session) {
        const requirements = await this.getResourceRequirements(params);

        return this.selectedTarget.discardResources(
            requirements,
            session.getExcludedCardIds(),
            {
                showCancel: true,
                title: this.getCostPaymentTitle(params),
            }
        );
    }
    async execute(params) {
        const {selectedTarget} = this;
        const requirements = await this.getResourceRequirements(params);
        const payment = params.costPaymentSession?.hasPayment(this) ?
            params.costPaymentSession.getPayment(this) :
            await selectedTarget.discardResources(
                requirements,
                new Set(),
                {
                    showCancel: true,
                    title: this.getCostPaymentTitle(params),
                }
            );

        this.cards = [];
        if (!payment) {
            this.paymentCancelled = true;

            return;
        }

        const cards = [...new Set(payment.hand || [])]
            .filter(card => selectedTarget.hand.cards.includes(card));
        if (!this.isValidPayment(payment, cards, requirements)) {
            throw new Error(
                'El descarte no satisface los requisitos de recursos impresos.'
            );
        }

        this.cards = cards;
        const discardFromHandEffect = new DiscardFromHandEffect({
            match: this.match,
        });

        await this.promisesSequential(this.cards, async card => {
            discardFromHandEffect.selectedTarget = card;

            await discardFromHandEffect.runEffect(params);
        });
    }
    isResolved() {
        return this.cards.length > 0;
    }
    isFullResolved() {
        return this.isResolved();
    }
}
