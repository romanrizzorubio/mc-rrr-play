import {RESOURCE_WILD,TARGET_ANY} from 'mc-shared';
import {Ability} from '../core/ability.js';

export class ResourceAbility extends Ability {
    constructor({
// Ability
        effect: _effect, limit: _limit, maximum: _maximum, arrow: _arrow,
// ResourceAbility
        resource,
        target = TARGET_ANY,
    }) {
        super(arguments[0]);

        this.resource = resource;
        this.target = target;

        this.isResource = true;
    }
    canRun(params) {
        const {resourceType} = params;
        const resources = this.getGeneratedResources(params);

        if (!resources.length) {
            return false;
        }

        if (resourceType &&
            !resources.includes(resourceType) &&
            !resources.includes(RESOURCE_WILD)) {
            return false;
        }

        return super.canRun(params);
    }
    getGeneratedResources(params = {}) {
        const {effect} = this;

        if (effect && typeof effect.getGeneratedResources === 'function') {
            let {player} = params;
            if (!player && this.card) {
                player = this.card.controller || this.card.owner;
            }

            return effect.getGeneratedResources({
                ...params,
                player,
            });
        }

        return this.resource ? [this.resource] : [];
    }
    toObj() {
        const {resource: configuredResource, target, type} = this;
        const hasDynamicResources = this.effect &&
            typeof this.effect.getGeneratedResources === 'function';
        const resources = this.getGeneratedResources(arguments[0]);
        let resource = configuredResource;
        if (hasDynamicResources) {
            resource = resources[0];
        }

        return {
            ...super.toObj(arguments[0]),
            target,
            resource,
            resources: hasDynamicResources ? resources : undefined,
            type,
        };
    }
}