import {path} from '../../engine/utils.js';

import {Card} from './card.js';

export class PlayerCard extends Card {
    constructor({
// Card
        name: _name, set: _set, image: _image, traits: _traits, ability: _ability, unique: _unique, icons: _icons, keywords: _keywords,
// PlayerCard
        cost,
        classification,
        paramsToPlay,
        resources = [],
        requirement = [],
    }) {
        super(arguments[0]);

        this.cost = cost;
        this.resources = resources;
        this.paramsToPlay = paramsToPlay;
        this.classification = classification;
        this.requirement = requirement;

        this.isPlayerCard = true;
        this.isAlly = false;
        this.isAlterEgo = false;
        this.isEvent = false;
        this.isHero = false;
        this.isResource = false;
        this.isSuperhero = false;
        this.isSupport = false;
        this.isUpgrade = false;
    }
    canPlay(params) {
        // TODO: Implement stricter validation for unique cards and ally limits
        if (this.paramsToPlay) {
            return Object.keys(this.paramsToPlay)
                .every(key =>
                    this.paramsToPlay[key] === path(params.player, key));
        }

        return true;
    }
    getResources() {
        return this.resources;
    }
    toObj(params = {}) {
        const {cost} = this;
        const {card} = params;

        const resources = this.getResources(card);

        return {
            ...super.toObj(arguments[0]),
            cost,
            resources,
        };
    }
}