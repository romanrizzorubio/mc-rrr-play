import {TARGET_TOP_CARD} from 'mc-shared';
import {Effect} from './effect.js';

export class GenerateResourcesFromCardEffect extends Effect {
    constructor(params) {
        super(params);

        this.position = params.position;
        this.isPaid = false;
    }
    async canRun(params) {
        if (!this.getGeneratedResources(params).length) {
            return false;
        }

        return super.canRun(params);
    }
    getGeneratedResources(params = {}) {
        const card = this.getResourceCard(params);
        if (!card) {
            return [];
        }

        if (!card.isCard || !card.card ||
            typeof card.card.getPrintedResources !== 'function') {
            throw new Error('Resource generation target must be a card with printed resources.');
        }

        const resources = card.card.getPrintedResources();
        if (!Array.isArray(resources)) {
            throw new Error('Printed resources must resolve to an array.');
        }

        return [...resources];
    }
    getResourceCard(params = {}) {
        if (this.position !== undefined && this.position !== TARGET_TOP_CARD) {
            throw new Error(`Unsupported resource card position: ${this.position}`);
        }

        const cards = this.validTarget.getValidTarget({
            ...params,
            ability: this.ability,
            target: this.target,
        });

        if (!cards.length) {
            return undefined;
        }

        if (this.position === TARGET_TOP_CARD) {
            return cards[cards.length - 1];
        }

        if (cards.length > 1) {
            throw new Error('Resource generation requires a single card target or position.');
        }

        return cards[0];
    }
    getValidTarget(params) {
        const card = this.getResourceCard(params);
        return card ? [card] : [];
    }
    selectTarget(params) {
        return this.getResourceCard(params);
    }
    isResolved() {
        return this.isPaid;
    }
    isFullResolved() {
        return this.isPaid;
    }
    execute(params) {
        this.isPaid = this.getGeneratedResources(params).length > 0;
    }
}
