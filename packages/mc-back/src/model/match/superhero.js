import {CharacterGameCard} from "../cards/character-game-card.js";

export const CARD_TYPE_SUPERHERO = 'superhero';
export class Superhero extends CharacterGameCard {
    constructor({
// GameCard
        sides = [],
// Superhero
        heroCards,
        obligations,
        nemesis,
        deck,
    }) {
        super(arguments[0]);

        this.heroCards = heroCards;
        this.obligations = obligations;
        this.nemesis = nemesis;
        this.deck = deck;

        this.flipped = false;
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
        return this.currentSide.handSize;
    }
    get hazardIcons() {
        return this.currentSide.hazardIcons;
    }
    get hitPoints() {
        return this.currentSide.hitPoints;
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
    get traits() {
        return this.currentSide.traits;
    }
    async init() {
        const controller = this.controller;

        await super.init();

        this.controller = controller;
    }
    toObj() {
        const {flipped, id, life, mainName} = this;

        return {
            ...super.toObj(arguments[0]),
            mainName,
            life,
            flipped,
            id
        }
    }
}