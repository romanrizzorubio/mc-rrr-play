import {EVENTS} from 'mc-endpoints';
import {
    DIALOG_ENCOUNTERS_REVEAL,
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
        mainSchemes,
        scenarioCards,
        setAsideCards = [],
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
        this.extraDecks = {};
        this.gameZone = undefined;
        this.apart = [];
        this.addApart(setAsideCards);
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
        return this.gameZone.hazardIcons;
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
        if (this.villain.id === cardId) {
            return this.villain;
        } else if (this.mainScheme.id === cardId) {
            return this.mainScheme;
        }

        return this.gameZone.getCard(cardId) ||
            this.villain?.getCard(cardId) ||
            this.gameZone.cards
                .map(card => card.getCard(cardId))
                .find(Boolean);
    }
    async initScenario(obligations, expert) {
        this.gameZone = new ScenarioZone({owner: this});
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

        this.gameZone.currentScheme = this.mainSchemes.shift();

        this.deck.initDeck(cards);

        this.villains = expert ?
            this.mainScheme.content.villainsExpert.map(stage => this.villains.find(villain => villain.stage === stage)) :
            this.mainScheme.content.villains.map(stage => this.villains.find(villain => villain.stage === stage));

        await this.selectVillain();

        const currentScheme = this.gameZone.currentScheme;
        const player = this.match.initialPlayer;

        await this.match.openDialog({
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: MAIN_SCHEME_REVEAL_TITLE,
            data: {
                card: currentScheme.currentSide.toObj({player}),
                horizontal: true,
            },
        });
        await currentScheme.setup({player});
        await currentScheme.flip();
        currentScheme.currentSide.initScheme();
        await this.match.openDialog({
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: MAIN_SCHEME_REVEAL_TITLE,
            data: {
                card: currentScheme.currentSide.toObj({player}),
                horizontal: true,
            },
        });
    }
    async completeMainScheme(completedScheme, params) {
        const currentScheme = this.gameZone.currentScheme;
        const currentSide = currentScheme.currentSide;

        if (completedScheme !== currentSide ||
            currentSide.threat < currentSide.value) {
            return false;
        }

        const nextScheme = this.mainSchemes[0];

        await this.match.openDialog({
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: this.getMainSchemeDialogTitle(currentSide, 'B'),
            subtitle: 'Etapa completada',
            data: {
                card: currentSide.toObj(params),
                horizontal: true,
            },
        });

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
        this.match.removeCard(currentScheme);

        this.gameZone.currentScheme = nextScheme;
        nextScheme.selectedSide = nextScheme.sides.indexOf(nextSchemeASide);

        const player = params.player || this.match.initialPlayer;
        await this.match.refresh();
        await this.match.openDialog({
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: MAIN_SCHEME_REVEAL_TITLE,
            data: {
                card: nextSchemeASide.toObj(params),
                horizontal: true,
            },
        });
        await this.revealMainSchemeSide(nextSchemeASide, player);
        await nextScheme.flip({
            player,
            selectedFormTarget: nextSchemeBSide,
        });
        nextScheme.currentSide.initScheme();
        nextScheme.currentSide.accelerationTokens += accelerationTokens;
        await this.match.refresh();
        await this.match.openDialog({
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: MAIN_SCHEME_REVEAL_TITLE,
            data: {
                card: nextScheme.currentSide.toObj(params),
                horizontal: true,
            },
        });
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
        const currentVillain = this.gameZone.currentVillain;

        if (currentVillain) {
            await this.match.openDialog({
                dialogType: DIALOG_ENCOUNTERS_REVEAL,
                title: `${currentVillain.name} ha sido derrotado`,
                data: {
                    card: currentVillain.toObj({player}),
                },
            });
        }

        if (!this.villains.length) {
            await this.match.finishGame(MATCH_END_REASON_VILLAIN_DEFEATED);
            this.match.mc.mcSocket.send(
                this.match.name,
                EVENTS.SCENARIO.DEFEAT,
                this.toObj()
            );
            return;
        }

        const nextVillain = this.villains.shift();

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
            }

            currentVillain.endTriggers();
        }

        this.gameZone.currentVillain = nextVillain;

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
    toObj() {
        const {
            name,
            villain,
            mainScheme,
            deck,
            extraDecks = {},
            gameZone,
        } = this;

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
        };
    }
    async toObjWithAbilityAvailability(player) {
        const [villain, mainScheme, gameZone] = await Promise.all([
            this.villain ?
            this.villain.toObjWithAbilityAvailability(player) :
            null,
            this.gameZone.currentScheme ?
            this.gameZone.currentScheme.toObjWithAbilityAvailability(player) :
                null,
            this.gameZone.toObjWithAbilityAvailability(player),
        ]);

        return {
            ...this.toObj(),
            villain,
            mainScheme,
            gameZone,
        };
    }
}