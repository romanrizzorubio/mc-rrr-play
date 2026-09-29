import {PlayerCard} from "./player-card.js";
import {MixinCharacterCard} from "./mixins/mixin-character-card.js";
import {MixinFriendFrontCard} from "./mixins/mixin-friend-front-card.js";
import {checkCondition, path} from "../../engine/utils.js";

export const CARD_TYPE_RESOURCE = 'resource';
export class ResourceCard extends PlayerCard {
    constructor({
// Card
        name, set, image, traits, abilities, unique, icons, keywords,
// PlayerCard
        cost, resources, classification, canPlay,
    }) {
        super(arguments[0]);

        this.isResource = true;
    }
    canPlay(params) {
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
        })

        return resources;
    }

}