import {TARGET_CARD} from 'mc-shared';
import {REFRESH_EVENTS} from 'mc-endpoints';
import {ReadyEffect} from '../../effects/ready-effect.js';
import {Engine} from '../../engine/engine.js';
import {checkCondition, path} from '../../engine/utils.js';

export class GameZone extends Engine {
    constructor({owner}) {
        super();

        this.owner = owner;

        this.cards = [];
    }
    get accelerationIcons() {
        let accelerationIcons = 0;

        this.cards.forEach(card => {
            accelerationIcons += card.accelerationIcons;
        });

        return accelerationIcons;
    }
    get accelerationTokens() {
        let accelerationTokens = 0;

        this.cards.forEach(card => {
            accelerationTokens += card.accelerationTokens;
        });

        return accelerationTokens;
    }
    get hasCrisis() {
        return this.cards.some(card => card.hasCrisis);
    }
    get hazardIcons() {
        let hazardIcons = 0;

        this.cards.forEach(card => {
            hazardIcons += card.hazardIcons;
        });

        return hazardIcons;
    }
    get match() {
        return path(this, 'owner.match');
    }
    get supports() {
        return this.cards.filter(card => card.isSupport);
    }
    get upgrades() {
        return this.cards.filter(card => card.isUpgrade);
    }
    async refresh() {
        const {match, objectToRefresh} = this;
        const gameZone = this.owner.isPlayer ?
            await this.toObjWithAbilityAvailability(this.owner) :
            this.toObj();

        match.mc.mcSocket.send(
            match.name,
            REFRESH_EVENTS[objectToRefresh],
            gameZone
        );
        await Promise.all(match.players.map(player => player.hand.refresh()));
    }
    addToGameZone(card) {
        this.cards.push(card);
    }
    dealEncounterCard(cards) {
        this.encounters = this.encounters.concat(cards);
    }
    discard(card) {
        return this.remove(card);
    }
    getCard(cardId) {
        return this.cards.find(card => card.id === cardId);
    }
    getPrintedCard(cardId) {
        return this.cards.find(card => card.card.id === cardId);
    }
    readyCards() {
        return this.promisesSequential(this.cards, async card => {
            const readyEffect = new ReadyEffect({
                target: TARGET_CARD,
                match: this.match,
            });
            await readyEffect.runEffect({
                card,
            });
        });
    }
    remove(card) {
        card.endTriggers();
        const index = this.cards.indexOf(card);
        if (index > -1) {
            this.cards.splice(index, 1);
        }

        return card;
    }
    searchCard(condition) {
        return this.cards
            .find(card =>
                checkCondition(card, condition));
    }
    searchCards(condition) {
        return this.cards
            .filter(card =>
                checkCondition(card, condition));
    }
    toObj() {
        const {cards} = this;

        return {
            cards: cards.map(card => card.toObj(arguments[0])),
        };
    }
    async toObjWithAbilityAvailability(player) {
        return {
            ...this.toObj(),
            cards: await Promise.all(this.cards.map(card =>
                card.toObjWithAbilityAvailability(player))),
        };
    }
}