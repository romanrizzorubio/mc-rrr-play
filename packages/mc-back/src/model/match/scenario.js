import {endpoints} from '../../constants/endpoints.js';
import {PutPlayEffect} from '../../effects/put-play-effect.js';
import {RevealEncounterEffect} from '../../effects/reveal-encounter-effect.js';
import {Engine} from '../../engine/engine.js';
import {checkCondition, path} from '../../engine/utils.js';

import {Deck} from './deck.js';
import {ScenarioZone} from './scenario-zone.js';

export class Scenario extends Engine {
    constructor({
// Scenario
        name,
        villains,
        mainSchemes,
        scenarioCards,
        sets,
        match,
    }) {
        super();

        this.name = name;
        this.villains = villains;
        this.mainSchemes = mainSchemes;
        this.scenarioCards = scenarioCards;
        this.sets = sets;
        this.match = match;

        this.deck = null;
        this.gameZone = undefined;
        this.apart = [];
    }
    addApart(cards) {
        if (!Array.isArray(cards)) {
            cards = [cards];
        }

        cards.forEach(card => {
            if (!card.owner) {
                card.owner = this;
            }

            this.apart.push(card);
        });
    }
    get accelerationIcons() {
        return this.gameZone.accelerationIcons;
    }
    get accelerationTokens() {
        return this.gameZone.accelerationTokens;
    }
    get hasCrisis() {
        return this.gameZone.hasCrisis;
    }
    get hazardIcons() {
        return this.gameZone.hazardIcons;
    }
    get mainScheme() {
        return path(this, 'gameZone.currentScheme.currentSide');
    }
    get objectToRefresh() {
        return 'scenario';
    }
    get schemes() {
        return this.gameZone.schemes;
    }
    get sideSchemes() {
        return this.gameZone.sideSchemes;
    }
    get villain() {
        return path(this, 'gameZone.currentVillain');
    }
    discardUntil(condition, removeFromDiscard = false) {
        return this.deck.discardUntil(condition, removeFromDiscard);
    }
    drawEncounterCards(count = 1) {
        return this.deck.draw(count);
    }
    getCard(cardId) {
        if (this.villain.id === cardId) {
            return this.villain;
        } else if (this.mainScheme.id === cardId) {
            return this.mainScheme;
        }

        return this.gameZone.getCard(cardId);
    }
    async initScenario(obligations, expert) {
        this.gameZone = new ScenarioZone({owner: this});
        this.deck = new Deck({
            owner: this,
            isScenarioDeck: true,
        });

        this.scenarioCards = this.scenarioCards.concat(obligations);

        this.sets.forEach(set => {
            if (expert && set.standard) {
                this.scenarioCards = this.scenarioCards.concat(set.expertSet);
            }
            this.scenarioCards = this.scenarioCards.concat(set.cards);
        });

        const cards = this.scenarioCards.map(card => {
            if (!card.owner) {
                card.owner = this;
            }

            return card;
        });

        this.gameZone.currentScheme = this.mainSchemes.shift();

        this.deck.initDeck(cards);

        this.villains = expert ?
            this.mainScheme.content.villainsExpert.map(stage => this.villains.find(villain => villain.stage === stage)) :
            this.mainScheme.content.villains.map(stage => this.villains.find(villain => villain.stage === stage));

        await this.selectVillain();

        await this.gameZone.currentScheme.setup();
        await this.gameZone.currentScheme.flip();
        this.gameZone.currentScheme.currentSide.initScheme();
    }
    removeCardFromDeck(card) {
        this.deck.removeCardFromDeck(card);
    }
    searchCard(condition) {
        if (checkCondition(this.villain, condition)) {
            return this.villain;
        }
        if (checkCondition(this.mainScheme, condition)) {
            return this.mainScheme;
        }
        return this.gameZone
            .searchCard(condition);
    }
    async selectVillain(player) {
        if (!this.villains.length) {
            this.match.mc.send(endpoints.scenario.defeat, this.toObj());
        }

        const nextVillain = this.villains.shift();

        if (this.gameZone.currentVillain) {
            if (nextVillain.name === this.gameZone.currentVillain.name) {
                nextVillain.owner = this;
                nextVillain.stunned = this.gameZone.currentVillain.stunned;
                nextVillain.confused = this.gameZone.currentVillain.confused;
                nextVillain.tough = this.gameZone.currentVillain.tough;
                nextVillain.faceDown = this.gameZone.currentVillain.faceDown;
                nextVillain.attached = this.gameZone.currentVillain.attached;
                nextVillain.selectedSide = this.gameZone.currentVillain.selectedSide;
                nextVillain.counters = this.gameZone.currentVillain.counters;
                nextVillain.exhausted = this.gameZone.currentVillain.exhausted;
                nextVillain.accelerationTokens = this.gameZone.currentVillain.accelerationTokens;
            }

            const revealEncounterEffect = new RevealEncounterEffect({
                selectedTarget: nextVillain,
                match: this.match,
            });
            await revealEncounterEffect.runEffect({player});
        }

        this.gameZone.currentVillain = nextVillain;

        const putPlayEffect = new PutPlayEffect({
            card: nextVillain,
            match: this.match,
        });
        await putPlayEffect.runEffect({
            force: true,
            card: nextVillain,
        });
    }
    toObj() {
        const {
            name,
            villain,
            mainScheme,
            deck,
            gameZone,
        } = this;

        return {
            ...super.toObj(),
            name,
            villain: villain && villain.toObj(),
            mainScheme: mainScheme && mainScheme.toObj(),
            deck: deck && deck.toObj(),
            gameZone: gameZone && gameZone.toObj(),
        };
    }
}