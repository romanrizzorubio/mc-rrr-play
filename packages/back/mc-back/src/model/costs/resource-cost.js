import {RESOURCE_ANY, RESOURCES_X} from 'mc-shared';
import {PlayCardResourceCostEffect} from '../../effects/play-card-resource-cost-effect.js';
import {Cost} from './cost.js';
import {COST_TYPE_RESOURCE} from './cost-constants.js';

export class ResourceCost extends Cost {
    constructor({
        amount,
        card,
        match,
        playCardEffect,
        requirement = card?.requirement || [],
        resourceType = card?.resourceType,
        allowOverpay = false,
    }) {
        super({type: COST_TYPE_RESOURCE, match});

        if (amount !== RESOURCES_X &&
            (!Number.isSafeInteger(amount) || amount < 0)) {
            throw new TypeError('A resource cost must be a non-negative integer.');
        }
        if (!Array.isArray(requirement)) {
            throw new TypeError('A resource cost requirement must be an array.');
        }
        if (typeof allowOverpay !== 'boolean') {
            throw new TypeError('A resource cost allowOverpay must be a boolean.');
        }

        this.amount = amount;
        this.card = card || playCardEffect?.card;
        this.playCardEffect = playCardEffect;
        this.requirement = requirement;
        this.resourceType = resourceType;
        this.allowOverpay = allowOverpay;
    }
    get requiresPayment() {
        return this.amount === RESOURCES_X ||
            this.amount > 0 ||
            this.requirement.length > 0 ||
            this.allowOverpay;
    }
    getRequiredResources() {
        if (this.amount === RESOURCES_X) {
            return [];
        }

        return Array(this.amount).fill(this.resourceType ?? RESOURCE_ANY);
    }
    getEffect() {
        if (!this.playCardEffect || !this.requiresPayment) {
            return undefined;
        }

        return this.markEffectAsCost(new PlayCardResourceCostEffect({
            match: this.match,
            resourceCost: this,
            playCardEffect: this.playCardEffect,
        }));
    }
}
