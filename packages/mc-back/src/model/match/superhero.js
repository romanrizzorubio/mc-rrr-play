import {
    TARGET_ALTEREGO,
    TARGET_HERO,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
} from 'mc-shared';

import {CharacterGameCard} from '../cards/character-game-card.js';

export class Superhero extends CharacterGameCard {
    static hasAbilityTrigger(card, ability) {
        return Object.values(card.triggers).some(triggersByPriority =>
            Object.values(triggersByPriority).some(triggers =>
                triggers.some(trigger => trigger.ability === ability)
            )
        );
    }
    static targetsIdentity(target, isHero, isAlterEgo) {
        const targets = Array.isArray(target) ? target : [target];

        return targets.some(targetType => {
            switch (targetType) {
                case TARGET_YOUR_SUPERHERO:
                    return true;
                case TARGET_HERO:
                case TARGET_YOUR_HERO:
                    return isHero;
                case TARGET_ALTEREGO:
                    return isAlterEgo;
                default:
                    return false;
            }
        });
    }
    constructor({
// GameCard
        sides: _sides = [],
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
    get traits() {
        return this.currentSide.traits;
    }
    async init() {
        const controller = this.controller;

        await super.init();

        this.controller = controller;
    }
    async initTriggers(params) {
        const {currentSide, isAlterEgo, isHero} = this;

        await this.promisesSequential(this.sides, async side => {
            await this.promisesSequential(side.abilities, async ability => {
                if (Superhero.hasAbilityTrigger(side, ability)) {
                    return;
                }

                if (side !== currentSide &&
                    (!ability.effect ||
                        !Superhero.targetsIdentity(
                            ability.effect.target,
                            isHero,
                            isAlterEgo
                        ))) {
                    return;
                }

                await ability.initTriggers(side, params);
            });
        });
    }
    endTriggers(force) {
        this.sides.forEach(side => side.endTriggers(force));
    }
    toObj() {
        const {flipped, id, life, mainName} = this;

        return {
            ...super.toObj(arguments[0]),
            mainName,
            life,
            flipped,
            id
        };
    }
}