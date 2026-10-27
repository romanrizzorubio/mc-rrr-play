import {checkCondition} from '../../engine/utils.js';
import {
    canPlayFromLocation,
    getPlayerCardLocation,
} from '../../utils/player-card-play-from.js';

import {Card} from './card.js';

export class PlayerCard extends Card {
    constructor({
// Card
        name: _name, set: _set, image: _image, traits: _traits, ability: _ability, unique: _unique, icons: _icons, keywords: _keywords,
// PlayerCard
        cost,
        classification,
        paramsToPlay,
        controllerTarget,
        playFrom = [],
        playTuckedCardsCondition,
        resources = [],
        resourceType,
        requirement = [],
        allowOverpay = false,
    }) {
        super(arguments[0]);

        if (!Array.isArray(playFrom)) {
            throw new TypeError('Player card playFrom must be an array of places.');
        }
        if (typeof allowOverpay !== 'boolean') {
            throw new TypeError('Player card allowOverpay must be a boolean.');
        }

        this.cost = cost;
        this.resources = resources;
        this.paramsToPlay = paramsToPlay;
        this.controllerTarget = controllerTarget;
        this.playFrom = [...playFrom];
        this.playTuckedCardsCondition = playTuckedCardsCondition;
        this.classification = classification;
        this.resourceType = resourceType;
        this.requirement = requirement;
        this.allowOverpay = allowOverpay;

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
        const {gameCard} = params;

        const sourcePlayer = gameCard?.owner ?? params.player;
        const source = gameCard && !sourcePlayer?.hand?.cards.includes(gameCard) ?
            getPlayerCardLocation(gameCard, sourcePlayer) :
            undefined;
        if (source &&
            !canPlayFromLocation(gameCard, this.playFrom, source)) {
            return false;
        }

        if (this.match && this.match.isUniqueCard(gameCard || this)) {
            return false;
        }

        if (this.paramsToPlay &&
            !checkCondition(params.player, this.paramsToPlay)) {
            return false;
        }

        return this.hasTeamUpCharacters(params.player);
    }
    hasTeamUpCharacters(player) {
        const teamUp = this.keywords.teamUp;
        if (!teamUp) {
            return true;
        }

        const friends = player?.match?.friends;
        if (!Array.isArray(friends)) {
            return false;
        }

        return friends.some(firstCharacter =>
            this.matchesTeamUpCharacter(firstCharacter, teamUp[0]) &&
            friends.some(secondCharacter =>
                firstCharacter !== secondCharacter &&
                this.matchesTeamUpCharacter(secondCharacter, teamUp[1])
            )
        );
    }
    matchesTeamUpCharacter(character, name) {
        const printedCard = character?.currentSide?.card ?? character?.card;

        return printedCard?.name === name || printedCard?.subtitle === name;
    }
    getResources() {
        return this.resources;
    }
    getPrintedResources() {
        return this.getResources();
    }
    toObj(params = {}) {
        const {cost, playFrom} = this;
        const {card} = params;

        const resources = this.getResources(card);

        return {
            ...super.toObj(arguments[0]),
            cost,
            resources,
            playFrom: [...playFrom],
        };
    }
}