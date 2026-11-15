import {
    ASPECT_IDS,
    hasClassification,
} from 'mc-shared';

import {CharacterGameCard} from '../cards/character-game-card.js';

export class Superhero extends CharacterGameCard {
    constructor({
// GameCard
        sides: _sides = [],
// Superhero
        heroCards,
        obligations,
        nemesis,
        deck,
        extraDecks = [],
    }) {
        super(arguments[0]);

        this.heroCards = heroCards;
        this.obligations = obligations;
        this.nemesis = nemesis;
        this.deck = deck;
        this.extraDecks = extraDecks;

        this.flipped = false;
        this.aspectMarkers = [];
    }
    addAspectMarkersFromCard(card, trigger) {
        const rules = this.owner?.config?.aspectMarkerRules;
        if (rules?.activateOn !== trigger || !card.isPlayerCard) {
            return;
        }

        const playedAspects = ASPECT_IDS.filter(aspect =>
            hasClassification(card.card.classification, aspect)
        );
        if (playedAspects.length) {
            this.aspectMarkers = [...new Set([
                ...(this.aspectMarkers ?? []),
                ...playedAspects,
            ])];
        }
    }

    clearAspectMarkers(trigger) {
        const rules = this.owner?.config?.aspectMarkerRules;
        if (rules?.deactivateOn === trigger) {
            this.aspectMarkers = [];
        }
    }
    get controller() {
        return super.controller;
    }
    set controller(controller) {
        if (controller) {
            super.controller = controller;
        }
    }
    get ability() {
        return this.currentSide.ability;
    }
    get accelerationIcons() {
        return this.currentSide.accelerationIcons;
    }
    get amplificationIcons() {
        return this.currentSide.amplificationIcons;
    }
    get attack() {
        return this.currentSide.attack;
    }
    get cards() {
        return this.heroCards;
    }
    get defense() {
        return this.currentSide.defense;
    }
    get handSize() {
        if (this.owner && this.owner.isPlayer) {
            return this.owner.handSize;
        }

        return this.currentSide.handSize;
    }
    get hazardIcons() {
        return this.currentSide.hazardIcons;
    }
    get hitPoints() {
        if (this.owner && this.owner.isPlayer) {
            return this.owner.hitPoints;
        }

        return super.hitPoints;
    }
    get isAlterEgo() {
        return this.currentSide.card.isAlterEgo;
    }
    get isHero() {
        return this.currentSide.isHero;
    }
    get life() {
        return this.hitPoints - this.damage;
    }
    get mainName() {
        if (this.sides.length) {
            return this.sides[1].name;
        }
        return this.card.name;
    }
    get name() {
        return this.currentSide.name;
    }
    get recovery() {
        return this.currentSide.recovery;
    }
    get thwart() {
        return this.currentSide.thwart;
    }
    async init() {
        const controller = this.controller;

        await super.init();

        this.controller = controller;
    }
    initTriggers(params) {
        if (!this.sides.length) {
            return super.initTriggers(params);
        }

        return this.currentSide.initTriggers(params);
    }
    endTriggers(force) {
        this.sides.forEach(side => side.endTriggers(force));
    }
    toObj() {
        const {flipped, id, life, mainName} = this;
        const aspectMarkers = this.aspectMarkers ?? [];
        const aspectMarkerRules = this.owner?.config?.aspectMarkerRules;

        return {
            ...super.toObj(arguments[0]),
            mainName,
            life,
            flipped,
            id,
            ...(aspectMarkerRules ? {aspectMarkers: [...aspectMarkers]} : {}),
        };
    }
}