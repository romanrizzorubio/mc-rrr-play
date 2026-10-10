import {checkCondition} from '../../engine/utils.js';

import {PlayerCard} from './player-card.js';

export class ResourceCard extends PlayerCard {
    constructor({
// Card
        name: _name, set: _set, image: _image, traits: _traits, abilities: _abilities, unique: _unique, icons: _icons, keywords: _keywords,
// PlayerCard
        cost: _cost, resources: _resources, classification: _classification, canPlay: _canPlay,
    }) {
        super(arguments[0]);

        this.isResource = true;
    }
    canPlay(_params) {
        throw new Error('Los Recursos no se pueden jugar.');
    }
    getResources(card) {
        let resources = [];

        this.resources.some(resource => {
            if (typeof resource === 'string') {
                resources.push(resource);
            } else {
                if (resource.condition) {
                    if (checkCondition(card, resource.condition)) {
                        resources = resources.concat(resource.resources);
                        return true;
                    }
                } else {
                    resources = resources.concat(resource.resources);
                    return true;
                }
            }
        });

        return resources;
    }
    getPrintedResources() {
        if (Array.isArray(this.resources)) {
            // Without a card being paid, conditional resource bonuses do not apply.
            return this.getResources();
        }

        if (!this.resources || typeof this.resources !== 'object') {
            throw new Error('Printed resource data must be an array or resource-count map.');
        }

        return Object.entries(this.resources).flatMap(([resource, count]) => {
            if (!Number.isInteger(count) || count < 0) {
                throw new Error(`Invalid printed resource count for ${resource}.`);
            }

            return Array(count).fill(resource);
        });
    }

}