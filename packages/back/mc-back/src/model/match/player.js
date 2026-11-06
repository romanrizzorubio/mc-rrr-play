import {
    DIALOG_DISCARD_HAND,
    DIALOG_LIST,
    DIALOG_PAY_COST,
    MATCH_END_REASON_ALL_HEROES_DEFEATED,
    PRIORITY_CONSTANT,
    RESOURCE_ANY,
    RESOURCE_PAYMENT_MODE_DISCARD,
    RESOURCE_PAYMENT_MODE_PAYMENT,
    RESOURCE_WILD,
    RESOURCES_X,
    TARGET_CARD,
    TRIGGER_PLAYER_CAN_USE_ABILITY,
    TRIGGER_PLAYER_CAN_FLIP,
    TRIGGER_PLAYER_CAN_PLAY,
    TRIGGER_PLAYER_CAN_READY,
    TRIGGER_PLAYER_CAN_THWART,
} from 'mc-shared';
import {EVENTS, REFRESH_EVENTS} from 'mc-endpoints';
import {randomUUID} from 'node:crypto';
import {DiscardFromHandEffect} from '../../effects/discard-from-hand-effect.js';
import {EngageEffect} from '../../effects/engage-effect.js';
import {FillHandEffect} from '../../effects/fill-hand-effect.js';
import {GetHitPointsEffect} from '../../effects/get-hit-points-effect.js';
import {GetHandSizeEffect} from '../../effects/get-hand-size-effect.js';
import {PlayCardEffect} from '../../effects/play-card-effect.js';
import {ReadyEffect} from '../../effects/ready-effect.js';
import {RevealEncounterEffect} from '../../effects/reveal-encounter-effect.js';
import {findPlayerCardToPlayFrom} from '../../utils/player-card-play-from.js';
import {Engine} from '../../engine/engine.js';
import {checkCondition} from '../../engine/utils.js';
import {findResourceAssignment} from '../../utils/find-resource-assignment.js';
import {
    getResourceIcons,
    normalizeResourceRequirements,
    toResourcePaymentCard,
} from '../../utils/resource-requirements.js';
import {normalizeResourceTypes} from '../../utils/resource-types.js';
import {getAbilitiesWithAvailability} from '../../utils/ability-availability.js';
import {
    assertOwnTurnOption,
    canPlayCardDuringTurn,
    isOtherPlayerTurn,
} from '../../utils/player-turn-permissions.js';

import {Deck} from './deck.js';
import {Hand} from './hand.js';
import {PlayerZone} from './player-zone.js';

export class Player extends Engine {
    constructor({
        id,
        name,
        userId,
        superhero,
        initial = false,
        config = {}
    }) {
        super();

        this.name = name;
        this.id = id || (userId ? randomUUID() : name);
        this.userId = userId;
        this.superhero = superhero;
        this.initial = initial;
        this.config = config;

        this.deck = undefined;
        this.extraDecks = {};
        this.hand = new Hand(this);
        this.gameZone = undefined;
        this.scenarioZone = undefined;

        this.mulliganDone = false;
        this.played = false;
        this.defeated = false;
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
    get amplificationIcons() {
        return this.superhero.amplificationIcons +
            this.gameZone.amplificationIcons;
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
    getExtraDeck(id) {
        return this.extraDecks?.[id];
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
        return this.superhero.hasCrisis ||
            this.gameZone.hasCrisis;
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
    get isSuperhero() {
        return this.superhero.isSuperhero;
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
    async canUseAbility(params = {}) {
        const {abilityType} = params;
        if (typeof abilityType !== 'string' || abilityType.length === 0) {
            return true;
        }

        const restrictions = {[abilityType]: true};
        await this.trigger(
            PRIORITY_CONSTANT,
            [TRIGGER_PLAYER_CAN_USE_ABILITY],
            {
                ...params,
                player: this,
                effect: restrictions,
                restrictions,
            }
        );

        return restrictions[abilityType];
    }
    async canThwart(params = {}) {
        const restrictions = {thwart: true};
        await this.trigger(
            PRIORITY_CONSTANT,
            [TRIGGER_PLAYER_CAN_THWART],
            {
                ...params,
                player: this,
                effect: restrictions,
                restrictions,
            }
        );

        return restrictions.thwart;
    }
    async canPlayCard(params = {}) {
        const restrictions = {play: true};
        await this.trigger(
            PRIORITY_CONSTANT,
            [TRIGGER_PLAYER_CAN_PLAY],
            {
                ...params,
                player: this,
                effect: restrictions,
                restrictions,
            }
        );

        return restrictions.play;
    }
    async canReady(params = {}) {
        const restrictions = {ready: true};
        await this.trigger(
            PRIORITY_CONSTANT,
            [TRIGGER_PLAYER_CAN_READY],
            {
                ...params,
                player: this,
                effect: restrictions,
                restrictions,
            }
        );

        return restrictions.ready;
    }
    async canFlip(params = {}) {
        const restrictions = {flip: true};
        await this.trigger(
            PRIORITY_CONSTANT,
            [TRIGGER_PLAYER_CAN_FLIP],
            {
                ...params,
                player: this,
                effect: restrictions,
                restrictions,
            }
        );

        return restrictions.flip;
    }
    confuse() {
        return this.superhero.confuse();
    }
    async defeat() {
        if (this.defeated) {
            return;
        }

        this.defeated = true;
        this.match.mc.mcSocket.send(
            this.match.name,
            EVENTS.PLAYER.DEFEAT,
            this.toObj()
        );

        if (this.match.players.every(player => player.defeated)) {
            await this.match.finishGame(MATCH_END_REASON_ALL_HEROES_DEFEATED);
        } else {
            const startIndex = this.match.players.indexOf(this);
            const nextPlayers = this.match.players.slice(startIndex + 1)
                .concat(this.match.players.slice(0, startIndex));
            if (this.initial) {
                await this.match.setInitialPlayer(
                    nextPlayers.find(player => !player.defeated)
                );
            }
            const scenarioZone = this.scenarioZone;
            for (const minion of this.minions.slice()) {
                const nextPlayer = nextPlayers.find(player =>
                    !player.defeated &&
                    (!this.match.scenario?.separatePlayAreas ||
                        player.scenarioZone === scenarioZone));
                if (!nextPlayer || this.match.gameOverReason) {
                    break;
                }
                const engageEffect = new EngageEffect({
                    selectedTarget: nextPlayer,
                    match: this.match,
                });
                await engageEffect.runEffect({card: minion, player: nextPlayer});
            }
            if (this.match.scenario?.separatePlayAreas &&
                scenarioZone?.players.length &&
                scenarioZone.players.every(player => player.defeated)) {
                if (scenarioZone.currentScheme?.currentSide?.stage === 3) {
                    await this.match.scenario.completeMainScheme(
                        scenarioZone.currentScheme.currentSide,
                        {
                            player: this,
                            card: scenarioZone.currentScheme,
                            effect: {selectedTarget: scenarioZone.currentScheme},
                            match: this.match,
                        }
                    );
                } else {
                    await this.match.scenario.mergeZone(scenarioZone);
                }
            }
            await this.match.refresh();
        }
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
        if (own) {
            assertOwnTurnOption(this);
        }
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

        return this.gameZone.getCard(cardId) ||
            this.gameZone.minions.find(minion => minion.id === cardId) ||
            Object.values(this.extraDecks || {})
                .flatMap(deck => [...deck.cards, ...deck.discardPile])
                .find(card => card.id === cardId);
    }
    async getCardsToPay(
        cardToPlay,
        resourceType,
        excludedCardIds = new Set(),
        resourceUsage,
        {
            costOnlyResourceUsage,
            includeGenerators = true,
            printedResources = false,
        } = {}
    ) {
        return {
            generators: includeGenerators ?
                await this.getResourceGenerators(
                    cardToPlay,
                    resourceType,
                    excludedCardIds
                ) :
                [],
            hand: this.hand.getCardsToPay(
                cardToPlay,
                resourceType,
                excludedCardIds,
                resourceUsage,
                {costOnlyResourceUsage, printedResources}
            ),
        };
    }
    async getDirectResourcePayment({
        cardId,
        cardToPay,
        excludedCardIds = new Set(),
        resourceUsage,
        resourceType,
        source,
    } = {}) {
        if (!cardId ||
            (source !== 'hand' && source !== 'generators')) {
            throw new Error('El origen del pago de recursos no es válido.');
        }

        const cards = await this.getCardsToPay(
            cardToPay,
            resourceType,
            excludedCardIds,
            resourceUsage
        );
        const candidates = source === 'hand' ? cards.hand : cards.generators;
        const selected = candidates.find(card => card.id === cardId);

        if (!selected) {
            throw new Error('La carta de recursos ya no es válida para el pago.');
        }

        const resources = source === 'hand' ?
            getResourceIcons(selected, {cardToPay}) :
            selected.abilities
                .filter(ability => ability.isResource)
                .flatMap(ability => {
                    if (typeof ability.getGeneratedResources === 'function') {
                        return ability.getGeneratedResources({
                            card: selected,
                            cardToPay,
                            player: this,
                        });
                    }

                    return ability.resources || (ability.resource ?
                        [ability.resource] :
                        []);
                });
        const resourceTypes = normalizeResourceTypes(resourceType);
        const payableResources = resourceTypes.length &&
            !resourceTypes.includes(RESOURCE_ANY) ?
            resources.filter(resource =>
                resourceTypes.includes(resource) ||
                resource === RESOURCE_WILD
            ) :
            resources;

        if (!payableResources.length) {
            throw new Error('La carta no contiene un recurso válido para el pago.');
        }
        const sharedPaymentContributors =
            source === 'generators' &&
            selected.controller !== this ?
                await this.confirmSharedResourceContributions(
                    [selected],
                    cardToPay
                ) :
                [];
        if (sharedPaymentContributors === undefined) {
            return undefined;
        }
        const handCard = source === 'hand' ?
            this.hand.getCard(selected.id) :
            undefined;

        if (source === 'hand' && !handCard) {
            throw new Error('La carta de recursos ya no está en la mano.');
        }

        return {
            generators: source === 'generators' ? [selected] : [],
            hand: source === 'hand' ?
                [handCard] :
                [],
            resources: payableResources,
            sharedPaymentContributors,
        };
    }
    getPrintedCard(cardId) {
        return this.gameZone.getPrintedCard(cardId);
    }
    async getResourceGenerators(
        cardToPay,
        resourceType,
        excludedCardIds = new Set(),
        {includeShared = true} = {}
    ) {
        const generators = [];
        const resourceTypes = normalizeResourceTypes(resourceType);
        const unrestricted = !resourceTypes.length ||
            resourceTypes.includes(RESOURCE_ANY);
        const hasResourceGenerators = card => {
            if (unrestricted) {
                return card.hasResourceGenerators(cardToPay);
            }

            return this.promisesSequentialSome(resourceTypes, _resourceType =>
                card.hasResourceGenerators(cardToPay, _resourceType));
        };

        if (!excludedCardIds.has(this.superhero.currentSide.id) &&
            await hasResourceGenerators(this.superhero.currentSide)) {
            generators.push(this.superhero.currentSide);
        }

        await this.promisesSequential(this.gameZone.cards, async card => {
            if (!excludedCardIds.has(card.id) &&
                await hasResourceGenerators(card)) {
                generators.push(card);
            }
        });

        if (includeShared && !this.match.isResolvingPeril) {
            await this.promisesSequential(
                this.match.players.filter(player =>
                    player !== this && !player.defeated),
                async provider => {
                    const sharedGenerators =
                        await provider.getResourceGenerators(
                            cardToPay,
                            resourceType,
                            excludedCardIds,
                            {includeShared: false}
                        );
                    await this.promisesSequential(
                        sharedGenerators,
                        async generator => {
                            const canShare =
                                await this.promisesSequentialSome(
                                    generator.abilities,
                                    async ability => {
                                        if (!ability.isResource ||
                                            !ability.canGenerateForOtherPlayers) {
                                            return false;
                                        }
                                        const canGenerate = type =>
                                            ability.canRun({
                                                player: provider,
                                                card: generator,
                                                cardToPay,
                                                ...(type ? {resourceType: type} : {}),
                                            });

                                        return unrestricted ?
                                            canGenerate() :
                                            this.promisesSequentialSome(
                                                resourceTypes,
                                                canGenerate
                                            );
                                    }
                                );
                            if (!canShare ||
                                generators.some(card =>
                                    card.id === generator.id)) {
                                return;
                            }
                            generators.push(generator);
                        }
                    );
                }
            );
        }

        return generators;
    }
    async confirmSharedResourceContributions(generators, cardToPay) {
        const contributors = [];

        for (const generator of generators) {
            const controller = generator.controller;
            if (controller === this) {
                continue;
            }
            if (this.match.isResolvingPeril ||
                !controller?.isPlayer ||
                !await this.promisesSequentialSome(
                    generator.abilities,
                    ability => ability.isResource &&
                        ability.canGenerateForOtherPlayers &&
                        ability.canRun({
                            player: controller,
                            card: generator,
                            cardToPay,
                        })
                )) {
                return undefined;
            }

            const response = await this.match.openDialog({
                dialogType: DIALOG_LIST,
                targetPlayer: controller,
                targetPlayerName: controller.name,
                title: '¿Quieres ayudar a pagar?',
                subtitle: `${this.name} solicita usar ${generator.name} para pagar${cardToPay?.name ?
                    ` ${cardToPay.name}` :
                    ' un coste'}.`,
                hideOk: true,
                hand: controller.hand.cards.map(card =>
                    card.toObj({player: controller})),
                data: {
                    card: generator.toObj({player: controller}),
                    options: [
                        {id: 0, text: `Sí, contribuir con ${generator.name}`},
                        {id: 1, text: 'No ayudar'},
                    ],
                },
            });

            if (response?.selected?.id !== 0) {
                return undefined;
            }
            contributors.push(generator);
        }

        return contributors;
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
    initExtraDecks() {
        this.extraDecks = Object.fromEntries(
            (this.superhero.extraDecks || []).map(({id, name, cards}) => {
                const deck = new Deck({
                    owner: this,
                    id,
                    name,
                    isPlayerExtraDeck: true,
                    topCardFaceUp: true,
                });
                deck.initDeck(cards);

                return [id, deck];
            })
        );
    }
    initGameZone() {
        this.gameZone = new PlayerZone({owner: this});
    }
    initPlayer() {
        this.initDeck();
        this.initExtraDecks();
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
            targetPlayer: this,
            isMulligan: true,
            closeOnResponse: true,
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
        targetId,
    }) {
        const card = this.hand.getCard(cardId) ||
            findPlayerCardToPlayFrom(this, cardId);

        if (!card) {
            return;
        }

        if (!canPlayCardDuringTurn(card, this)) {
            assertOwnTurnOption(this);
        }

        const playCardEffect = new PlayCardEffect({
            card,
            abilityType,
            match: this.match,
            targetId,
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
    async readyAllCards() {
        const readyEffect = new ReadyEffect({
            target: TARGET_CARD,
            selectedTarget: [this.superhero, ...this.gameZone.cards],
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
    async resolveAbility(
        cardId,
        abilityIndex,
        targetId,
        resourcePayment
    ) {
        let card = this.getCard(cardId);
        if (!card) {
            card = this.match.scenario.getCard(cardId);
        }

        if (isOtherPlayerTurn(this)) {
            const ability = (card?.currentSide?.abilities ?? card?.abilities)?.[abilityIndex];
            if (!ability?.isAction) {
                assertOwnTurnOption(this);
            }
        }

        const params = {
            player: this,
            abilityIndex,
            ...(resourcePayment !== undefined ? {resourcePayment} : {}),
        };

        if (targetId !== undefined) {
            const abilities = card?.currentSide?.abilities ?? card?.abilities;
            const ability = abilities?.[abilityIndex];

            if (!ability ||
                (!ability.isAction &&
                    (!ability.isBasic ||
                        (!ability.isAttack && !ability.isThwart))) ||
                !ability.effect) {
                throw new Error('La capacidad no admite una activación con objetivo preseleccionado.');
            }

            ability.prepareEffect();
            const abilityParams = {
                ...params,
                card,
                match: this.match,
            };
            const validTargets = await ability.effect.getValidTarget(abilityParams);
            const selectedTarget = validTargets.find(target =>
                target.id === targetId || target.parentId === targetId);

            if (!selectedTarget) {
                throw new Error('El objetivo de la activación ya no es válido.');
            }

            const activationParams = {
                ...abilityParams,
                activationTargetId: targetId,
            };
            const isBasicAttackOrThwart = ability.isBasic &&
                (ability.isAttack || ability.isThwart);

            if (isBasicAttackOrThwart) {
                if (!await ability.canRun(activationParams)) {
                    throw new Error('La activación seleccionada ya no está disponible.');
                }

                ability.effect.selectedTarget = selectedTarget;
                await card.resolveAbility({
                    ...activationParams,
                    preselectedTarget: true,
                    fixedPreselectedTarget: true,
                    selectedTarget,
                    activationTarget: selectedTarget,
                    abilityIndex,
                });
                return;
            }

            const isDistributedMultipleTarget =
                ability.effect.distribute &&
                ability.effect.validTarget.isMultipleTarget({
                    target: ability.effect.target,
                });

            if (isDistributedMultipleTarget) {
                if (!await ability.canRun(activationParams)) {
                    throw new Error('La activación seleccionada ya no está disponible.');
                }

                await card.resolveAbility({
                    ...activationParams,
                    abilityIndex,
                });
                return;
            }

            ability.effect.selectedTarget = selectedTarget;
            const preselectedParams = {
                ...activationParams,
                preselectedTarget: true,
                fixedPreselectedTarget: true,
                selectedTarget,
            };
            if (!await ability.canRun(preselectedParams)) {
                throw new Error('La activación seleccionada ya no está disponible.');
            }

            await card.resolveAbility({
                ...preselectedParams,
                abilityIndex,
            });
            return;
        }

        await card.resolveAbility(params);
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
        while (!this.defeated && !this.match.gameOverReason && this.encounters.length) {
            const card = this.encounters.shift();
            await this.revealEncounterCard(card);
        }
    }
    resolveResourceAbility(cardId, cardPaid) {
        const card = this.getCard(cardId);

        return card.resolveResourceAbility({card, cardPaid, player: this});
    }
    async selectEndPlayersPhaseDiscards(params) {
        if (!this.hand.cards.length) {
            return [];
        }

        const {selected} = await this.openDialog({
            dialogType: DIALOG_DISCARD_HAND,
            targetPlayer: this,
            data: {
                hand: await this.getHandSize(),
                cards: this.hand.cards.map(card => card.toObj(params))
            },
        });

        return selected;
    }
    async runEndPlayersPhase(params, selected) {
        if (selected === undefined) {
            selected = await this.selectEndPlayersPhaseDiscards(params);
        }

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

        const fillHandEffect = new FillHandEffect({
            match: this.match,
        });
        await fillHandEffect.runEffect({player: this});

        this.superhero.flipped = false;

        await this.readyAllCards();
    }
    async spendResources(
        resources,
        cardToPay,
        excludedCardIds = new Set(),
        {
            allowPartial = false,
            showCancel = !allowPartial,
            differentTypes = false,
            resourceUsage,
        } = {}
    ) {
        const cardsToPay = await this.getCardsToPay(
            cardToPay,
            resources,
            excludedCardIds,
            resourceUsage
        );
        const response = await this.openDialog({
            dialogType: DIALOG_PAY_COST,
            targetPlayer: this,
            showCancel,
            ...(differentTypes ? {title: 'Paga recursos de tipos distintos'} : {}),
            data: {
                allowPartial,
                differentTypes,
                resourcePaymentMode: RESOURCE_PAYMENT_MODE_PAYMENT,
                resourceSelectionMode: resourceUsage !== undefined,
                cost: resources.length,
                requirement: resources,
                card: cardToPay ? cardToPay.toObj() : undefined,
                cards: {
                    generators: cardsToPay.generators.map(generator =>
                        generator.toObj({card: cardToPay})),
                    hand: cardsToPay.hand.map(resourceCard =>
                        toResourcePaymentCard(resourceCard, {}, {
                            cardToPay,
                        })),
                }
            },
        });

        if (response) {
            const {paid, resources: paidResources, fullyPaid} = response;
            if (differentTypes &&
                new Set(paidResources || []).size < resources.length) {
                throw new Error('El pago requiere recursos de tipos distintos.');
            }
            const generators = paid.generators.map(card => {
                const generator = cardsToPay.generators.find(candidate =>
                    candidate.id === card.id);
                if (!generator) {
                    throw new Error(
                        'El generador seleccionado ya no está disponible para el pago.'
                    );
                }

                return generator;
            });
            const sharedPaymentContributors =
                await this.confirmSharedResourceContributions(
                    generators,
                    cardToPay
                );
            if (sharedPaymentContributors === undefined) {
                return undefined;
            }
            const hand = paid.hand.map(card => {
                const handCard = this.hand.getCard(card.id);
                if (!handCard) {
                    throw new Error(
                        'La carta seleccionada ya no está en la mano.'
                    );
                }

                return handCard;
            });

            return {
                resources: paidResources,
                fullyPaid: fullyPaid ?? !allowPartial,
                hand,
                generators,
                sharedPaymentContributors,
            };
        }
    }
    async discardResources(
        resourceRequirements,
        excludedCardIds = new Set(),
        {
            cardToPay,
            showCancel = true,
            title = 'Descarta iconos de recursos de tu mano',
        } = {}
    ) {
        const requirements = normalizeResourceRequirements(resourceRequirements);
        const cards = this.hand.cards.filter(card =>
            !excludedCardIds.has(card.id) &&
            getResourceIcons(card, {printed: true}).length > 0
        );
        const eligibleCards = cards.filter(card =>
            findResourceAssignment(
                cards,
                requirements,
                card,
                {allowWildConversion: false, printed: true}
            )
        );
        if (!findResourceAssignment(
            cards,
            requirements,
            undefined,
            {allowWildConversion: false, printed: true}
        )) {
            return undefined;
        }

        const response = await this.openDialog({
            dialogType: DIALOG_PAY_COST,
            targetPlayer: this,
            showCancel,
            title,
            data: {
                allowPartial: false,
                allowWildConversion: false,
                card: cardToPay ? cardToPay.toObj() : undefined,
                cost: requirements.length,
                requirement: requirements,
                resourcePaymentMode: RESOURCE_PAYMENT_MODE_DISCARD,
                resourceSelectionMode: true,
                resourceRequirements: requirements,
                cards: {
                    generators: [],
                    hand: eligibleCards.map(card =>
                        toResourcePaymentCard(card, {}, {printed: true})),
                },
            },
        });

        if (!response) {
            return undefined;
        }

        const paid = response.paid || {};
        const hand = (paid.hand || []).map(card => {
            const selectedCard = this.hand.getCard(card.id);
            if (!selectedCard ||
                !eligibleCards.includes(selectedCard)) {
                throw new Error('La selección de recursos descartados no es válida.');
            }

            return selectedCard;
        });

        return {
            allowWildConversion: false,
            generators: [],
            hand,
            printedResources: true,
            resourceRequirements: requirements,
            resources: response.resources || [],
        };
    }
    async spendResourcesX(
        resources,
        cardToPay,
        resourceType,
        excludedCardIds = new Set(),
        resourceUsage
    ) {
        const cardsToPay = await this.getCardsToPay(
            cardToPay,
            resourceType,
            excludedCardIds,
            resourceUsage
        );
        const response = await this.openDialog({
            dialogType: DIALOG_PAY_COST,
            targetPlayer: this,
            showCancel: true,
            data: {
                resourcePaymentMode: RESOURCE_PAYMENT_MODE_PAYMENT,
                resourceType,
                resourceSelectionMode: resourceUsage !== undefined,
                cost: RESOURCES_X,
                requirement: resources,
                card: cardToPay ? cardToPay.toObj() : undefined,
                cards: {
                    generators: cardsToPay.generators.map(generator =>
                        generator.toObj({card: cardToPay})),
                    hand: cardsToPay.hand.map(resourceCard =>
                        toResourcePaymentCard(resourceCard, {}, {
                            cardToPay,
                        })),
                }
            },
        });

        if (response) {
            const {paid, resources} = response;
            const generators = paid.generators.map(card => {
                const generator = cardsToPay.generators.find(candidate =>
                    candidate.id === card.id);
                if (!generator) {
                    throw new Error(
                        'El generador seleccionado ya no está disponible para el pago.'
                    );
                }

                return generator;
            });
            const sharedPaymentContributors =
                await this.confirmSharedResourceContributions(
                    generators,
                    cardToPay
                );
            if (sharedPaymentContributors === undefined) {
                return undefined;
            }
            const hand = paid.hand.map(card => {
                const handCard = this.hand.getCard(card.id);
                if (!handCard) {
                    throw new Error(
                        'La carta seleccionada ya no está en la mano.'
                    );
                }

                return handCard;
            });

            return {
                resources: resourceType ? resources.filter(r => r === resourceType) : resources,
                hand,
                generators,
                sharedPaymentContributors,
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
    toTargetObj(params = {}) {
        return {
            ...this.superhero.toObj(params),
            id: this.id,
            isPlayer: true,
            showPlayerHero: true,
        };
    }
    toObj() {
        const {
            id,
            name,
            userId,
            initial,
            defeated,
            deck,
            hand,
            superhero,
            gameZone,
            scenarioZone,
            handSize,
        } = this;

        return {
            id,
            isPlayer: true,
            name,
            ...(userId ? {userId} : {}),
            ...(initial !== undefined ? {initial} : {}),
            defeated,
            scenarioZoneId: scenarioZone?.id,
            handSize,
            deck: deck ? deck.toObj(arguments[0]) : undefined,
            extraDecks: Object.fromEntries(
                Object.entries(this.extraDecks || {}).map(([id, extraDeck]) => [
                    id,
                    extraDeck.toObj(arguments[0]),
                ])
            ),
            hand: hand ? hand.toObj(arguments[0]) : undefined,
            superhero: superhero ? superhero.toObj(arguments[0]) : undefined,
            gameZone: gameZone ? gameZone.toObj(arguments[0]) : undefined,
        };
    }
    async toObjWithPlayableHand() {
        const {superhero} = this;
        const effectiveTraits = await superhero.getEffectiveTraits();
        const stats = await superhero.getEffectiveStats();
        const canFlip = !isOtherPlayerTurn(this) &&
            await this.canFlip({card: superhero});
        const handSize = await this.getHandSize();
        const abilities = await getAbilitiesWithAvailability(superhero, this);
        const attached = await Promise.all(superhero.getAttachedCards().map(card =>
            card.toObjWithAbilityAvailability(this)));
        const hand = await this.hand.toObjWithPlayability();
        const gameZone = this.gameZone ?
            await this.gameZone.toObjWithAbilityAvailability(this) :
            undefined;
        const printedTraits = superhero.currentSide.card ?
            superhero.currentSide.card.traits || [] :
            superhero.currentSide.traits || [];
        const player = this.toObj();
        const extraTraits = [...new Set([
            ...player.superhero.extraTraits,
            ...effectiveTraits,
        ])].filter(trait => !printedTraits.includes(trait));

        return {
            ...player,
            handSize,
            hand,
            gameZone: gameZone ?? player.gameZone,
            superhero: {
                ...player.superhero,
                ...stats,
                extraTraits,
                abilities,
                attached,
                canFlip,
            },
        };
    }
}