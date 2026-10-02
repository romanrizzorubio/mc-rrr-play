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

}