import {
    DIALOG_DISCARD_HAND,
    DIALOG_PAY_COST,
    RESOURCES_X,
    TARGET_CARD,
} from 'mc-shared';
import {EVENTS, REFRESH_EVENTS} from 'mc-endpoints';
import {DiscardFromHandEffect} from '../../effects/discard-from-hand-effect.js';
import {FillHandEffect} from '../../effects/fill-hand-effect.js';
import {GetHitPointsEffect} from '../../effects/get-hit-points-effect.js';
import {GetHandSizeEffect} from '../../effects/get-hand-size-effect.js';
import {PlayCardEffect} from '../../effects/play-card-effect.js';
import {ReadyEffect} from '../../effects/ready-effect.js';
import {RevealEncounterEffect} from '../../effects/reveal-encounter-effect.js';
import {Engine} from '../../engine/engine.js';
import {checkCondition} from '../../engine/utils.js';

import {Deck} from './deck.js';
import {Hand} from './hand.js';
import {PlayerZone} from './player-zone.js';

export class Player extends Engine {
    constructor({
        name,
        superhero,
        initial = false,
        config = {}
    }) {
        super();

        this.name = name;
        this.superhero = superhero;
        this.initial = initial;
        this.config = config;

        this.deck = undefined;
        this.hand = new Hand(this);
        this.gameZone = undefined;

        this.mulliganDone = false;
        this.played = false;
        this.isPlayer = true;

        superhero.owner = this;
        superhero.controller = this;
    }
    get accelerationIcons() {
        return this.superhero.accelerationIcons +
            this.gameZone.accelerationIcons;
    }
    get accelerationTokens() {
        return this.superhero.accelerationTokens +
            this.gameZone.accelerationTokens;
    }
    get allies() {
        return this.gameZone.cards.filter(card => card.isAlly);
    }
    get attached() {
        return [];
    }
    get canDefendBasic() {
        return this.isHero && !this.exhausted;
    }
    get canHeal() {
        return !!this.damage;
    }
    get damage() {
        return this.superhero.damage;
    }
    get defenders() {
        const defenders = this.allies.filter(ally => ally.canDefendBasic);

        if (this.canDefendBasic) {
            defenders.unshift(this.superhero);
        }

        return defenders;
    }
    get encounters() {
        return this.gameZone.encounters;
    }
    get exhausted() {
        return this.superhero.exhausted;
    }
    get flipped() {
        return this.superhero.flipped;
    }
    get friends() {
        const friends = this.allies;

        friends.push(this.superhero);

        return friends;
    }
    get handSize() {
        return this.superhero.currentSide.handSize;
    }
    async getHandSize() {
        const getHandSizeEffect = new GetHandSizeEffect({
            selectedTarget: this.superhero,
            match: this.match,
        });

        await getHandSizeEffect.runEffect({player: this});

        return getHandSizeEffect.handSize;
    }
    get hasCrisis() {
        return this.gameZone.hasCrisis;
    }
    get hasGuard() {
        return this.gameZone.hasGuard;
    }
    get hasPatrol() {
        return this.gameZone.hasPatrol;
    }
    get hazardIcons() {
        return this.superhero.hazardIcons +
            this.gameZone.hazardIcons;
    }
    get hitPoints() {
        return this.superhero.currentSide.hitPoints +
            this.superhero.modifyHitPoints;
    }
    async getHitPoints() {
        const getHitPointsEffect = new GetHitPointsEffect({
            selectedTarget: this.superhero,
            match: this.match,
        });

        await getHitPointsEffect.runEffect({player: this});

        return getHitPointsEffect.hitPoints;
    }
    get isAlterEgo() {
        return this.superhero.isAlterEgo;
    }
    get isConfused() {
        return this.superhero.isConfused;
    }
    get isHero() {
        return this.superhero.isHero;
    }
    get isStunned() {
        return this.superhero.isStunned;
    }
    get life() {
        return this.superhero.life;
    }
    async getLife() {
        const hitPoints = await this.getHitPoints();

        return hitPoints - this.superhero.damage;
    }
    get match() {
        return this.superhero.match;
    }
    get minions() {
        return this.gameZone.minions;
    }
    get objectToRefresh() {
        return 'player';
    }
    async refresh() {
        this.match.mc.mcSocket.send(
            this.match.name,
            REFRESH_EVENTS[this.objectToRefresh],
            await this.toObjWithPlayableHand()
        );
    }
    get owner() {
        return this;
    }
    get supports() {
        return this.gameZone.supports;
    }
    get traits() {
        return this.superhero.traits;
    }
    get upgrades() {
        return this.gameZone.upgrades;
    }
    async addEncounterCard(count = 1) {
        const cards = await this.match.drawEncounterCards(count);

        await this.gameZone.addEncounterCard(cards);
    }
    addToGameZone(card) {
        card.controller = this;
        this.gameZone.addToGameZone(card);
    }
    canAttack(_params) {
        return true;
    }
    canBeAttacked() {
        return true;
    }
    canDefend(_params) {
        return true;
    }
    canThwart(_params) {
        return true;
    }
    confuse() {
        return this.superhero.confuse();
    }
    defeat() {
        this.match.mc.mcSocket.send(
            this.match.name,
            EVENTS.PLAYER.DEFEAT,
            this.toObj()
        );
    }
    discardHand(card) {
        const discardFromHandEffect = new DiscardFromHandEffect({
            selectedTarget: card,
            match: this.match,
        });

        return discardFromHandEffect.runEffect({player: this});
    }
    engage(minion) {
        this.gameZone.engage(minion);
    }
    exhaust() {
        this.superhero.exhaust();
    }
    async fillHand() {
        const fillHandEffect = new FillHandEffect({
            match: this.match,
        });

        await fillHandEffect.runEffect({player: this});
    }
    async flip(own = false) {
        if (own && this.flipped) {
            return;
        }
        await this.superhero.flip({
            player: this,
            own
        });
    }
    getCard(cardId) {
        if (this.superhero.id === cardId) {
            return this.superhero;
        } else if (this.superhero.currentSide.id === cardId) {
            return this.superhero.currentSide;
        }

        return this.gameZone.getCard(cardId);
    }
    async getCardsToPay(cardToPlay, resourceType, excludedCardIds = new Set()) {
        return {
            generators: await this.getResourceGenerators(
                cardToPlay,
                resourceType,
                excludedCardIds
            ),
            hand: this.hand.getCardsToPay(cardToPlay, resourceType, excludedCardIds),
        };
    }
    getPrintedCard(cardId) {
        return this.gameZone.getPrintedCard(cardId);
    }
    async getResourceGenerators(cardToPay, resourceType, excludedCardIds = new Set()) {
        const generators = [];

        if (!excludedCardIds.has(this.superhero.currentSide.id) &&
            await this.superhero.currentSide.hasResourceGenerators(cardToPay, resourceType)) {
            generators.push(this.superhero.currentSide);
        }

        await this.promisesSequential(this.gameZone.cards, async card => {
            if (!excludedCardIds.has(card.id) &&
                await card.hasResourceGenerators(cardToPay, resourceType)) {
                generators.push(card);
            }
        });

        return generators;
    }
    healDamage(damage) {
        return this.superhero.healDamage(damage);
    }
    initDeck() {
        this.deck = new Deck({
            owner: this,
            isPlayerDeck: true,
        });

        this.deck.initDeck(this.superhero.cards.concat(this.superhero.deck));
    }
    initGameZone() {
        this.gameZone = new PlayerZone({owner: this});
    }
    initPlayer() {
        this.initDeck();
        this.initGameZone();
    }
    initNemesis() {
        this.match.scenario.addApart(this.superhero.nemesis);
    }
    searchCard(condition) {
        if (checkCondition(this.superhero, condition)) {
            return this.superhero;
        }

        const card = this.gameZone.searchCard(condition);
        if (card) {
            return card;
        }

        const minion = this.gameZone.minions.find(minion =>
            checkCondition(minion, condition));
        if (minion) {
            return minion;
        }

        return this.hand.cards.find(card => checkCondition(card, condition));
    }
    async mulligan() {
        const response = await this.openDialog({
            dialogType: DIALOG_DISCARD_HAND,
            data: {
                hand: await this.getHandSize(),
                cards: this.hand.cards.map(card => card.toObj(arguments[0]))
            },
        });

        const {selected} = response;

        return this.finishMulligan(selected.map(sel => this.hand.getCard(sel.id)));
    }
    async finishMulligan(selected) {
        await this.promisesSequential(selected, this.discardHand.bind(this));
        await this.fillHand();
        this.mulliganDone = true;
    }
    placeDamage(damage) {
        return this.superhero.placeDamage(damage);
    }
    async playCard({
        cardId,
        abilityType,
    }) {
        const card = this.hand.getCard(cardId);

        const playCardEffect = new PlayCardEffect({
            card,
            abilityType,
            match: this.match,
        });

        const params = {player: this};

        if (await playCardEffect.canRun(params)) {
            await playCardEffect.runEffect({
                ...params,
                card,
            });
        }
    }
    async ready() {
        const readyEffect = new ReadyEffect({
            target: TARGET_CARD,
            match: this.match,
        });
        await readyEffect.runEffect({
            card: this.superhero,
        });
    }
    removeConfused(count = 0) {
        return this.superhero.removeConfused(count);
    }
    removeEngaged(card) {
        this.gameZone.removeEngaged(card);
    }
    removeStunned(count = 0) {
        return this.superhero.removeStunned(count);
    }
    async resolveAbility(cardId, abilityIndex) {
        let card = this.getCard(cardId);
        if (!card) {
            card = this.match.scenario.getCard(cardId);
        }

        await card.resolveAbility({
            player: this,
            abilityIndex,
        });
    }
    revealEncounterCard(card) {
        const revealEncounterEffect = new RevealEncounterEffect({
            selectedTarget: card,
            match: this.match,
        });

        return revealEncounterEffect.runEffect({
            player: this,
        });
    }
    async revealEncounterCards() {
        while (this.encounters.length) {
            const card = this.encounters.shift();
            await this.revealEncounterCard(card);
        }
    }
    resolveResourceAbility(cardId, cardPaid) {
        const card = this.getCard(cardId);

        return card.resolveResourceAbility({card, cardPaid, player: this});
    }
    async runEndPlayersPhase(_params) {
        if (this.hand.cards.length) {
            const {selected} = await this.openDialog({
                dialogType: DIALOG_DISCARD_HAND,
                data: {
                    hand: await this.getHandSize(),
                    cards: this.hand.cards.map(card => card.toObj(arguments[0]))
                },
            });

            await this.promisesSequential(selected, card => {
                const discardFromHandEffect = new DiscardFromHandEffect({
                    target: TARGET_CARD,
                    match: this.match,
                });

                return discardFromHandEffect.runEffect({
                    card: this.hand.getCard(card.id),
                    player: this,
                });
            });
        }

        const fillHandEffect = new FillHandEffect({
            match: this.match,
        });
        await fillHandEffect.runEffect({player: this});

        this.superhero.flipped = false;

        await this.ready();

        await this.gameZone.readyCards();
    }
    async spendResources(resources, cardToPay, excludedCardIds = new Set()) {
        const cardsToPay = await this.getCardsToPay(
            cardToPay,
            undefined,
            excludedCardIds
        );
        const response = await this.openDialog({
            dialogType: DIALOG_PAY_COST,
            showCancel: true,
            data: {
                cost: resources.length,
                requirement: resources,
                card: cardToPay ? cardToPay.toObj() : undefined,
                cards: {
                    generators: cardsToPay.generators.map(generator =>
                        generator.toObj({card: cardToPay})),
                    hand: cardsToPay.hand.map(resourceCard =>
                        resourceCard.toObj({card: cardToPay})),
                }
            },
        });

        if (response) {
            const {paid, resources} = response;

            return {
                resources,
                hand: paid.hand.map(card => this.hand.getCard(card.id)),
                generators: paid.generators.map(card => this.getCard(card.id)),
            };
        }
    }
    async spendResourcesX(resources, cardToPay, resourceType, excludedCardIds = new Set()) {
        const cardsToPay = await this.getCardsToPay(
            cardToPay,
            resourceType,
            excludedCardIds
        );
        const response = await this.openDialog({
            dialogType: DIALOG_PAY_COST,
            showCancel: true,
            data: {
                resourceType,
                cost: RESOURCES_X,
                requirement: resources,
                card: cardToPay ? cardToPay.toObj() : undefined,
                cards: {
                    generators: cardsToPay.generators.map(generator =>
                        generator.toObj({card: cardToPay})),
                    hand: cardsToPay.hand.map(resourceCard =>
                        resourceCard.toObj({card: cardToPay})),
                }
            },
        });

        if (response) {
            const {paid, resources} = response;

            return {
                resources: resourceType ? resources.filter(r => r === resourceType) : resources,
                hand: paid.hand.map(card => this.hand.getCard(card.id)),
                generators: paid.generators.map(card => this.getCard(card.id)),
            };
        }
    }
    stun() {
        return this.superhero.stun();
    }
    async triggerEvent(trigger, params) {
        const {card, ability} = trigger;

        const playCardEffect = new PlayCardEffect({
            card,
            ability,
            match: this.match,
        });

        await playCardEffect.runEffect(params);

        return {
            triggered: !playCardEffect.canceled,
            paymentCancelled: playCardEffect.paymentCancelled,
        };
    }
    toObj() {
        const {
            name,
            deck,
            hand,
            superhero,
            gameZone,
            handSize,
        } = this;

        return {
            name,
            handSize,
            deck: deck ? deck.toObj(arguments[0]) : undefined,
            hand: hand ? hand.toObj(arguments[0]) : undefined,
            superhero: superhero ? superhero.toObj(arguments[0]) : undefined,
            gameZone: gameZone ? gameZone.toObj(arguments[0]) : undefined,
        };
    }
    async toObjWithPlayableHand() {
        const player = this.toObj();
        const handSize = await this.getHandSize();
        const hitPoints = await this.getHitPoints();
        const life = hitPoints - this.superhero.damage;
        const {superhero} = this;
        const stats = await superhero.getEffectiveStats();
        const abilities = await Promise.all(
            superhero.currentSide.abilities.map(async (ability, index) => {
                const serializedAbility = {
                    ...ability.toObj(),
                    index,
                };

                if (!ability.isAction && !ability.isBasic) {
                    return serializedAbility;
                }

                ability.prepareEffect();

                return {
                    ...serializedAbility,
                    disable: !(await ability.canRun({
                        player: this,
                        card: superhero,
                    })),
                };
            })
        );

        return {
            ...player,
            handSize,
            hand: await this.hand.toObjWithPlayability(),
            gameZone: this.gameZone ?
                await this.gameZone.toObjWithAbilityAvailability(this) :
                player.gameZone,
            superhero: {
                ...player.superhero,
                ...stats,
                hitPoints,
                life,
                abilities,
            },
        };
    }
}