import {EVENTS} from 'mc-endpoints';
import {
    DIALOG_ENCOUNTERS_REVEAL,
    DIALOG_LIST,
    MATCH_END_REASON_MAIN_SCHEME_COMPLETED,
    MATCH_END_REASON_VILLAIN_DEFEATED,
    PRIORITY_FORCED_RESPONSE,
    TRIGGER_MAIN_SCHEME_COMPLETED,
} from 'mc-shared';
import {PutPlayEffect} from '../../effects/put-play-effect.js';
import {RevealEncounterEffect} from '../../effects/reveal-encounter-effect.js';
import {Engine} from '../../engine/engine.js';
import {checkCondition, path} from '../../engine/utils.js';

import {Deck} from './deck.js';
import {ScenarioZone} from './scenario-zone.js';

const MAIN_SCHEME_REVEAL_TITLE = 'Mostrando el Plan principal';

export class Scenario extends Engine {
    constructor({
// Scenario
        name,
        villains,
        expertVillains,
        mainSchemes,
        scenarioCards,
        setAsideCards = [],
        sets,
        manualVillainProgression = false,
        manualMainSchemeProgression = false,
        separatePlayAreas = false,
        match,
    }) {
        super();

        this.name = name;
        this.villains = villains;
        this.expertVillains = expertVillains ?? villains;
        this.mainSchemes = mainSchemes;
        this.allMainSchemes = mainSchemes.slice();
        this.usedMainSchemes = new Set();
        this.scenarioCards = scenarioCards;
        this.sets = sets;
        this.manualVillainProgression = manualVillainProgression;
        this.finalVillainDefeated = false;
        this.manualMainSchemeProgression = manualMainSchemeProgression;
        this.separatePlayAreas = separatePlayAreas;
        this.match = match;

        this.deck = null;
        this.extraDecks = {};
        this.gameZone = undefined;
        this.zones = [];
        this.apart = [];
        this.delayedEffects = [];
        this.addApart(setAsideCards);
    }
    createDelayedEffect(effect) {
        this.delayedEffects ??= [];
        this.delayedEffects.push(effect);
    }
    async resolveDelayedEffects(params) {
        const scheduledEffects = (this.delayedEffects ?? []).slice();
        for (const delayedEffect of scheduledEffects) {
            await delayedEffect.resolve({
                ...params,
                match: this.match,
            });
            this.delayedEffects = (this.delayedEffects ?? []).filter(effect =>
                effect !== delayedEffect);
        }
    }
    createZone({id} = {}) {
        const zone = new ScenarioZone({
            id: id ?? `scenario-zone-${this.zones.length + 1}`,
            owner: this,
        });
        this.zones.push(zone);
        if (!this.gameZone) {
            this.gameZone = zone;
        }

        return zone;
    }
    getZoneForPlayer(player) {
        return player?.scenarioZone &&
            this.zones.includes(player.scenarioZone) ?
            player.scenarioZone :
            this.gameZone;
    }
    removeZone(zone) {
        if (!this.zones.includes(zone)) {
            return false;
        }

        zone.players.slice().forEach(player => zone.removePlayer(player));
        this.zones.splice(this.zones.indexOf(zone), 1);
        if (this.gameZone === zone) {
            this.gameZone = this.zones[0];
        }

        return true;
    }
    getMergeDestinations(sourceZone) {
        const destinations = this.zones.filter(zone => zone !== sourceZone);
        const onlyDestination = destinations.length === 1;
        const stageTwoZone = destinations.find(zone =>
            zone.currentScheme?.currentSide?.stage === 2);

        return destinations.filter(zone =>
            zone !== stageTwoZone || onlyDestination);
    }
    async selectMergeDestination(player, sourceZone) {
        const destinations = this.getMergeDestinations(sourceZone);
        if (!destinations.length) {
            throw new Error('No hay otra zona de juego a la que unirse.');
        }
        if (destinations.length === 1) {
            return destinations[0];
        }

        const {selected} = await this.match.openDialog({
            dialogType: DIALOG_LIST,
            title: 'Elige una zona de juego',
            targetPlayer: player.id || player.userId || player.name,
            targetPlayerName: player.name,
            hand: player.hand.cards.map(card => card.toObj({player})),
            data: {
                card: player.superhero.toObj({player}),
                options: destinations.map((zone, id) => ({
                    id,
                    text: zone.currentScheme?.currentSide?.name ??
                        `Zona de juego ${id + 1}`,
                })),
            },
        });
        const destination = destinations[selected?.id];
        if (!destination) {
            throw new Error('No se pudo determinar la zona de juego elegida.');
        }

        return destination;
    }
    async mergeZone(zone) {
        if (!this.zones.includes(zone)) {
            return false;
        }

        const livingPlayers = zone.players.filter(player => !player.defeated);
        if (!livingPlayers.length) {
            for (const card of zone.inPlayCards) {
                card.endTriggers?.();
                await card.removeAttached?.();
                await card.discardCardsUnder?.();
                this.match.removeCard(card);
            }
            this.removeZone(zone);
            await this.match.refresh();
            return true;
        }

        const firstPlayerIndex = this.match.players.indexOf(
            this.match.initialPlayer
        );
        const orderedPlayers = firstPlayerIndex < 0 ?
            livingPlayers :
            this.match.players
                .slice(firstPlayerIndex)
                .concat(this.match.players.slice(0, firstPlayerIndex))
                .filter(player => livingPlayers.includes(player));
        const destinations = new Map();
        for (const player of orderedPlayers) {
            const destination = await this.selectMergeDestination(player, zone);
            destinations.set(player, destination);
            destination.addPlayer(player);
        }

        const globalFirstPlayer = this.match.initialPlayer;
        if (!destinations.has(globalFirstPlayer)) {
            destinations.set(
                globalFirstPlayer,
                await this.selectMergeDestination(globalFirstPlayer, zone)
            );
        }
        const commonDestination = destinations.get(globalFirstPlayer);

        const zoneCards = zone.cards.filter(card =>
            card !== zone.currentVillain && card !== zone.currentScheme);
        for (const card of zoneCards) {
            const linkedPlayer = card.engaged?.isPlayer ?
                card.engaged :
                card.controller?.isPlayer ?
                    card.controller :
                    card.owner?.isPlayer ?
                        card.owner :
                        undefined;
            const destination = destinations.get(linkedPlayer) ??
                commonDestination;
            zone.remove(card);
            destination.addToGameZone(card);
            await card.initTriggers();
        }

        if (zone.currentVillain) {
            zone.currentVillain.endTriggers();
            await zone.currentVillain.removeAttached();
            await zone.currentVillain.discardCardsUnder?.();
            this.match.removeCard(zone.currentVillain);
            zone.currentVillain = null;
        }
        if (zone.currentScheme) {
            zone.currentScheme.endTriggers(true);
            await zone.currentScheme.currentSide.removeAttached();
            await zone.currentScheme.discardCardsUnder?.();
            this.match.removeCard(zone.currentScheme);
            zone.currentScheme = null;
        }

        this.removeZone(zone);
        const livingMatchPlayers = this.match.players.filter(player =>
            !player.defeated);
        const stageTwoZone = this.zones.find(candidate =>
            candidate.currentScheme?.currentSide?.stage === 2);
        if (stageTwoZone && livingMatchPlayers.length &&
            livingMatchPlayers.every(player =>
                stageTwoZone.players.includes(player))) {
            await this.advanceMainScheme(
                stageTwoZone,
                4,
                this.match.initialPlayer,
            );
        }

        await this.match.refresh();
        return true;
    }
    get inPlayCards() {
        return this.zones.flatMap(zone => zone.inPlayCards);
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
    get amplificationIcons() {
        return this.gameZone.amplificationIcons;
    }
    get hasCrisis() {
        return this.gameZone.hasCrisis;
    }
    get hazardIcons() {
        const zones = this.zones?.length ?
            this.zones :
            [this.gameZone].filter(Boolean);

        return zones.reduce((total, zone) =>
            total + (zone.hazardIcons ?? 0), 0);
    }
    get mainScheme() {
        return path(this, 'gameZone.currentScheme.currentSide');
    }
    getMainSchemeDialogTitle(schemeSide, side) {
        return `${schemeSide.name} (${schemeSide.stage}${side})`;
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
    discardUntil(condition, removeFromDiscard = false, discardedCards) {
        return this.deck.discardUntil(condition, removeFromDiscard, discardedCards);
    }
    drawEncounterCards(count = 1) {
        return this.deck.draw(count);
    }
    getExtraDeck(id) {
        const deck = this.extraDecks?.[id];
        if (!deck) {
            throw new Error(`No existe un mazo auxiliar del escenario con ID "${id}".`);
        }

        return deck;
    }
    getExtraDeckForCard(card) {
        const matchingDecks = Object.values(this.extraDecks || {}).filter(deck =>
            deck.collectCondition &&
            checkCondition(card, deck.collectCondition));

        if (matchingDecks.length > 1) {
            throw new Error(
                `La carta "${card.name}" coincide con varios mazos auxiliares del escenario.`
            );
        }

        return matchingDecks[0];
    }
    createExtraDeck(id, {
        cardCondition,
        collectCondition,
        name,
        hasDiscard = false,
    } = {}) {
        if (!this.deck) {
            throw new Error('No se puede crear un mazo auxiliar antes de construir el mazo de Encuentros.');
        }
        if (this.extraDecks[id]) {
            throw new Error(`Ya existe un mazo auxiliar del escenario con ID "${id}".`);
        }
        if (cardCondition !== undefined &&
            (!cardCondition || typeof cardCondition !== 'object' ||
                Array.isArray(cardCondition) || Object.keys(cardCondition).length === 0)) {
            throw new TypeError(
                'La condición de un mazo auxiliar debe ser un objeto no vacío.'
            );
        }
        if (collectCondition !== undefined &&
            (!collectCondition || typeof collectCondition !== 'object' ||
                Array.isArray(collectCondition) ||
                Object.keys(collectCondition).length === 0)) {
            throw new TypeError(
                'La condición de recogida de un mazo auxiliar debe ser un objeto no vacío.'
            );
        }
        if (collectCondition !== undefined && !hasDiscard) {
            throw new TypeError(
                'Un mazo auxiliar que recoge cartas debe tener una pila de descartes.'
            );
        }
        if (typeof hasDiscard !== 'boolean') {
            throw new TypeError('hasDiscard de un mazo auxiliar debe ser booleano.');
        }
        if (name !== undefined && (typeof name !== 'string' || !name)) {
            throw new TypeError('El nombre del mazo auxiliar debe ser una cadena no vacía.');
        }

        const set = this.sets.find(({cards}) =>
            cards.some(card => card.set === id));
        if (!set && cardCondition === undefined) {
            throw new Error(`El conjunto "${id}" no está configurado en el escenario.`);
        }

        const cards = cardCondition === undefined ?
            set.cards.filter(card => this.deck.cards.includes(card)) :
            this.deck.cards.filter(card => checkCondition(card, cardCondition));
        if (cardCondition === undefined &&
            (!cards.length || cards.length !== set.cards.length)) {
            throw new Error(
                `No se pueden mover todas las cartas del conjunto "${id}" al mazo auxiliar.`
            );
        }
        const deckName = name ?? set?.name;
        if (typeof deckName !== 'string' || !deckName) {
            throw new TypeError(
                'Un mazo auxiliar basado en una condición requiere un nombre.'
            );
        }

        const extraCards = new Set(cards);
        this.deck.cards = this.deck.cards.filter(card => !extraCards.has(card));
        this.deck.knownCards = this.deck.knownCards.filter(card =>
            !extraCards.has(card));

        const deck = new Deck({
            owner: this,
            id,
            name: deckName,
            isScenarioExtraDeck: true,
            hasDiscard,
            ...(hasDiscard ? {} : {discardTarget: this.deck}),
            collectCondition,
        });
        deck.initDeck(cards);
        this.extraDecks[id] = deck;

        return deck;
    }
    getCard(cardId) {
        const activeCards = this.zones.flatMap(zone => [
            zone.currentVillain,
            zone.currentScheme,
            ...zone.cards,
        ]).filter(Boolean);

        return activeCards.map(card =>
            card.id === cardId ||
            card.currentSide?.id === cardId ?
                card : card.getCard?.(cardId)).find(Boolean) ||
            this.gameZone?.cards
                .map(card => card.getCard(cardId))
                .find(Boolean);
    }
    getVillains() {
        return this.match.expert ? this.expertVillains : this.villains;
    }
    findVillain({name, stage}) {
        return this.getVillains().find(villain =>
            villain.name === name && villain.stage === stage);
    }
    findMainScheme(stage, {unused = true} = {}) {
        return this.allMainSchemes.find(scheme =>
            scheme.sides?.some(side => side.stage === stage) &&
            (!unused || !this.usedMainSchemes.has(scheme)));
    }
    async advanceMainScheme(
        zone,
        stage,
        player = this.match.initialPlayer,
        selectedScheme,
    ) {
        const nextScheme = selectedScheme ?? this.findMainScheme(stage);
        if (!nextScheme) {
            throw new Error(
                `No se encontró una etapa ${stage} sin utilizar del Plan principal.`
            );
        }
        if (this.usedMainSchemes.has(nextScheme)) {
            throw new Error(`La etapa ${stage} del Plan principal ya se utilizó.`);
        }

        const sideA = nextScheme.sides.find(side =>
            side.isMainScheme && side.final === undefined);
        const sideB = nextScheme.sides.find(side =>
            side.isMainScheme && side.final !== undefined);
        if (!sideA || !sideB) {
            throw new Error(`La etapa ${stage} no tiene lados A y B.`);
        }

        const currentScheme = zone.currentScheme;
        const accelerationTokens =
            currentScheme?.currentSide?.accelerationTokens ?? 0;
        if (currentScheme) {
            currentScheme.endTriggers(true);
            await currentScheme.currentSide.removeAttached();
            await currentScheme.discardCardsUnder?.();
            this.match.removeCard(currentScheme);
        }

        this.usedMainSchemes.add(nextScheme);
        if (typeof zone.addScheme === 'function') {
            zone.addScheme(nextScheme);
        } else {
            zone.currentScheme = nextScheme;
            nextScheme.scenarioZone = zone;
        }
        nextScheme.selectedSide = nextScheme.sides.indexOf(sideA);
        await this.match.refresh();
        await this.openPublicDialog({
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: MAIN_SCHEME_REVEAL_TITLE,
            data: {card: sideA.toObj({player}), horizontal: true},
        }, player);
        await this.revealMainSchemeSide(sideA, player);
        await nextScheme.setup({player});
        await nextScheme.flip({player, selectedFormTarget: sideB});
        nextScheme.currentSide.initScheme();
        nextScheme.currentSide.accelerationTokens += accelerationTokens;
        await this.match.refresh();
        await this.openPublicDialog({
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: MAIN_SCHEME_REVEAL_TITLE,
            data: {
                card: nextScheme.currentSide.toObj({player}),
                horizontal: true,
            },
        }, player);
        await this.revealMainSchemeSide(nextScheme.currentSide, player);

        return nextScheme;
    }
    async addVillainToZone({zone, name, stage, player}) {
        const villain = this.findVillain({name, stage});
        if (!villain) {
            throw new Error(
                `No se encontró el Villano "${name}" en la etapa ${stage}.`
            );
        }

        zone.addVillain(villain);
        const revealEffect = new RevealEncounterEffect({
            selectedTarget: villain,
            match: this.match,
        });
        await revealEffect.runEffect({player});
        const putPlayEffect = new PutPlayEffect({
            card: villain,
            controller: this,
            match: this.match,
        });
        await putPlayEffect.runEffect({force: true, card: villain, player});

        return villain;
    }
    async initScenario(obligations, expert = false) {
        this.match.expert = expert;
        this.zones = [];
        this.gameZone = this.createZone({id: 'scenario-zone-1'});
        (this.match.players ?? []).forEach(player =>
            this.gameZone.addPlayer(player));
        this.deck = new Deck({
            owner: this,
            isScenarioDeck: true,
        });
        this.extraDecks = {};

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

        const initialScheme = this.mainSchemes.shift();
        this.usedMainSchemes = new Set([initialScheme]);
        this.gameZone.addScheme(initialScheme);

        this.deck.initDeck(cards);

        this.finalVillainDefeated = false;
        if (!this.getVillains().length) {
            throw new Error('El escenario no define una secuencia de Villanos para la dificultad seleccionada.');
        }

        await this.selectVillain();

        const currentScheme = this.gameZone.currentScheme;
        const player = this.match.initialPlayer;

        await this.openPublicDialog({
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: MAIN_SCHEME_REVEAL_TITLE,
            data: {
                card: currentScheme.currentSide.toObj({player}),
                horizontal: true,
            },
        }, player);
        await currentScheme.setup({player});
        await currentScheme.flip();
        currentScheme.currentSide.initScheme();
        await this.openPublicDialog({
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: MAIN_SCHEME_REVEAL_TITLE,
            data: {
                card: currentScheme.currentSide.toObj({player}),
                horizontal: true,
            },
        }, player);
    }
    async completeMainScheme(completedScheme, params) {
        const completedCard = completedScheme?.parent ?? completedScheme;
        const zone = completedCard?.scenarioZone ??
            completedScheme?.scenarioZone ??
            this.gameZone;
        const currentScheme = zone?.currentScheme;
        const currentSide = currentScheme?.currentSide;
        const zoneDefeated = Boolean(
            this.separatePlayAreas &&
            zone?.players.length &&
            zone.players.every(player => player.defeated)
        );

        if (!currentSide || currentSide.completed ||
            (completedScheme !== currentSide && completedCard !== currentScheme) ||
            (!zoneDefeated &&
                (!Number.isFinite(currentSide.value) ||
                    currentSide.threat < currentSide.value))) {
            return false;
        }

        currentSide.completed = true;
        const nextScheme = this.mainSchemes[0];

        await this.openPublicDialog({
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: this.getMainSchemeDialogTitle(currentSide, 'B'),
            subtitle: 'Etapa completada',
            data: {
                card: currentSide.toObj(params),
                horizontal: true,
            },
        }, params.player);

        const completionParams = {
            ...params,
            card: currentScheme,
            effect: {selectedTarget: currentScheme},
            match: this.match,
        };
        const whenCompletedAbilities = (currentSide.abilities || []).filter(
            ability => ability.isWhenCompleted &&
                ability.isValidIdentity(completionParams) &&
                (!ability.condition ||
                    checkCondition(completionParams, ability.condition))
        );
        for (const ability of whenCompletedAbilities) {
            await ability.resolveAbility(completionParams);
        }

        await this.trigger(
            PRIORITY_FORCED_RESPONSE,
            [TRIGGER_MAIN_SCHEME_COMPLETED],
            completionParams
        );

        if (currentSide.final || !nextScheme) {
            await this.match.finishGame(MATCH_END_REASON_MAIN_SCHEME_COMPLETED);
            return false;
        }

        if (this.manualMainSchemeProgression) {
            return false;
        }

        const nextSchemeASide = nextScheme.sides.find(side =>
            side.isMainScheme && side.final === undefined);
        const nextSchemeBSide = nextScheme.sides.find(side =>
            side.isMainScheme && side.final !== undefined);
        if (!nextSchemeASide || !nextSchemeBSide) {
            throw new Error('La siguiente etapa del plan principal no tiene lados A y B.');
        }

        const accelerationTokens = currentSide.accelerationTokens;
        this.mainSchemes.shift();
        currentScheme.endTriggers(true);
        await currentSide.removeAttached();
        await currentScheme.discardCardsUnder?.();
        this.match.removeCard(currentScheme);

        if (typeof zone.addScheme === 'function') {
            zone.addScheme(nextScheme);
        } else {
            zone.currentScheme = nextScheme;
            nextScheme.scenarioZone = zone;
        }
        nextScheme.selectedSide = nextScheme.sides.indexOf(nextSchemeASide);

        const player = params.player || this.match.initialPlayer;
        await this.match.refresh();
        await this.openPublicDialog({
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: MAIN_SCHEME_REVEAL_TITLE,
            data: {
                card: nextSchemeASide.toObj(params),
                horizontal: true,
            },
        }, player);
        await this.revealMainSchemeSide(nextSchemeASide, player);
        await nextScheme.flip({
            player,
            selectedFormTarget: nextSchemeBSide,
        });
        nextScheme.currentSide.initScheme();
        nextScheme.currentSide.accelerationTokens += accelerationTokens;
        await this.match.refresh();
        await this.openPublicDialog({
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: MAIN_SCHEME_REVEAL_TITLE,
            data: {
                card: nextScheme.currentSide.toObj(params),
                horizontal: true,
            },
        }, player);
        await this.revealMainSchemeSide(nextScheme.currentSide, player);
        await this.match.refresh();

        return true;
    }
    async revealMainSchemeSide(schemeSide, player) {
        const revealEncounterEffect = new RevealEncounterEffect({
            selectedTarget: schemeSide,
            match: this.match,
        });
        await revealEncounterEffect.runEffect({player});
    }
    removeCardFromDeck(card) {
        this.deck.removeCardFromDeck(card);
    }
    searchCard(condition, player) {
        const zone = this.getZoneForPlayer(player);
        const villain = zone?.currentVillain;
        const mainScheme = zone?.currentScheme?.currentSide;
        if (checkCondition(villain, condition)) {
            return villain;
        }
        if (checkCondition(mainScheme, condition)) {
            return mainScheme;
        }
        return zone?.searchCard(condition);
    }
    searchCards(condition, player) {
        const zones = player ?
            [this.getZoneForPlayer(player)] :
            this.zones;
        return zones.flatMap(zone => zone?.searchCards(condition) ?? []);
    }
    async announceVillainDefeat(villain, player) {
        await this.openPublicDialog({
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: `${villain.name} ha sido derrotado`,
            data: {
                card: villain.toObj({player}),
            },
        }, player);
    }
    async selectVillain(player, defeatedVillain, {defeatAnnounced = false} = {}) {
        if (this.match.gameOverReason) {
            return;
        }
        const zone = defeatedVillain?.scenarioZone ??
            this.getZoneForPlayer(player);
        const currentVillain = zone?.currentVillain;
        if (defeatedVillain && defeatedVillain !== currentVillain) {
            return;
        }
        const villains = this.getVillains();
        const currentIndex = currentVillain ? villains.indexOf(currentVillain) : -1;
        if (currentVillain && currentIndex < 0) {
            throw new Error('El Villano actual no pertenece a la lista de la dificultad seleccionada.');
        }

        if (currentVillain && !defeatAnnounced) {
            await this.announceVillainDefeat(currentVillain, player);
        }

        const hasOtherVillains = this.zones.some(candidate =>
            candidate !== zone && candidate.currentVillain?.isInPlay);
        if (currentVillain && this.isFinalVillain(currentVillain)) {
            this.finalVillainDefeated = true;
        }
        if ((hasOtherVillains && this.finalVillainDefeated) ||
            (currentVillain && this.manualVillainProgression &&
                !this.finalVillainDefeated)) {
            currentVillain?.endTriggers();
            if (currentVillain) {
                await currentVillain.removeAttached?.();
                const nextVillain = this.manualVillainProgression &&
                    !this.finalVillainDefeated ?
                    villains[currentIndex + 1] :
                    undefined;
                if (nextVillain?.name === currentVillain.name) {
                    nextVillain.faceDown = currentVillain.faceDown;
                    nextVillain.faceDown.forEach(faceDown => {
                        faceDown.attached = nextVillain;
                    });
                    nextVillain.tuckedCards = currentVillain.tuckedCards;
                } else {
                    await currentVillain.discardCardsUnder?.();
                }
                this.match.removeCard(currentVillain);
            }
            if (zone?.currentVillain === currentVillain) {
                zone.currentVillain = null;
                await zone.refresh();
            }

            return;
        }

        if (this.finalVillainDefeated) {
            await this.winGame();
            return;
        }

        const nextVillain = villains[currentIndex + 1];
        if (!nextVillain) {
            throw new Error('El escenario no define un Villano inicial para la dificultad seleccionada.');
        }

        if (currentVillain) {
            if (currentVillain.sides?.length &&
                currentVillain.sides.length === nextVillain.sides?.length) {
                nextVillain.selectedSide = currentVillain.selectedSide;
            }

            if (nextVillain.name === currentVillain.name) {
                nextVillain.owner = this;
                nextVillain.stunned = currentVillain.stunned;
                nextVillain.confused = currentVillain.confused;
                nextVillain.tough = currentVillain.tough;
                nextVillain.faceDown = currentVillain.faceDown;
                nextVillain.faceDown.forEach(faceDown => {
                    faceDown.attached = nextVillain;
                });
                nextVillain.tuckedCards = currentVillain.tuckedCards;
                nextVillain.attached = currentVillain.attached;
                nextVillain.attached.forEach(attached => {
                    attached.attachedTo = nextVillain;
                });
                nextVillain.counters = currentVillain.counters;
                nextVillain.exhausted = currentVillain.exhausted;
                nextVillain.accelerationTokens = currentVillain.accelerationTokens;
                if (currentVillain.modifyHitPoints !== undefined) {
                    nextVillain.modifyHitPoints = currentVillain.modifyHitPoints;
                }
            } else {
                await currentVillain.discardCardsUnder?.();
            }

            currentVillain.endTriggers();
        }

        if (typeof zone.addVillain === 'function') {
            zone.addVillain(nextVillain);
        } else {
            zone.currentVillain = nextVillain;
            nextVillain.scenarioZone = zone;
        }

        if (currentVillain) {
            const revealEncounterEffect = new RevealEncounterEffect({
                selectedTarget: nextVillain,
                match: this.match,
            });
            await revealEncounterEffect.runEffect({player});
        }

        const putPlayEffect = new PutPlayEffect({
            card: nextVillain,
            match: this.match,
        });
        await putPlayEffect.runEffect({
            force: true,
            card: nextVillain,
        });
    }
    async winGame() {
        if (this.match.gameOverReason) {
            return;
        }
        await this.match.finishGame(MATCH_END_REASON_VILLAIN_DEFEATED);
        this.match.mc.mcSocket.send(
            this.match.name,
            EVENTS.SCENARIO.DEFEAT,
            this.toObj()
        );
    }
    isFinalVillain(villain) {
        if (villain?.card?.final) {
            return true;
        }

        return Boolean(villain) && this.getVillains().at(-1) === villain;
    }
    toObj() {
        const {
            name,
            villain,
            mainScheme,
            deck,
            extraDecks = {},
            gameZone,
        } = this;
        const zones = this.zones?.length ?
            this.zones :
            [gameZone].filter(Boolean);

        return {
            ...super.toObj(),
            name,
            villain: villain?.toObj(),
            mainScheme: mainScheme?.toObj(),
            deck: deck?.toObj(),
            extraDecks: Object.fromEntries(Object.entries(extraDecks).map(([id, extraDeck]) => [
                id,
                extraDeck.toObj(),
            ])),
            gameZone: gameZone?.toObj(),
            zones: zones.map(zone => zone.toObj()),
        };
    }
    async toObjWithAbilityAvailability(player) {
        const scenarioZones = this.zones?.length ?
            this.zones :
            [this.gameZone].filter(Boolean);
        const [villain, mainScheme, gameZone, zones] = await Promise.all([
            this.villain ?
            this.villain.toObjWithAbilityAvailability(player) :
            null,
            this.gameZone?.currentScheme ?
            this.gameZone.currentScheme.toObjWithAbilityAvailability(player) :
                null,
            this.gameZone?.toObjWithAbilityAvailability(player),
                Promise.all(scenarioZones.map(zone =>
                    zone.toObjWithAbilityAvailability(player))),
        ]);

        return {
            ...this.toObj(),
            villain,
            mainScheme,
            gameZone,
            zones,
        };
    }
}