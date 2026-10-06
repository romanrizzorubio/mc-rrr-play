import {EVENTS} from 'mc-endpoints';
import {
    DIALOG_ENCOUNTERS_REVEAL,
    MATCH_END_REASON_MAIN_SCHEME_COMPLETED,
    MATCH_END_REASON_VILLAIN_DEFEATED,
} from 'mc-shared';
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

        const currentScheme = this.gameZone.currentScheme;
        const player = this.match.initialPlayer;

        await this.match.openDialog({
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: this.getMainSchemeDialogTitle(currentScheme.currentSide, 'A'),
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
            title: this.getMainSchemeDialogTitle(currentScheme.currentSide, 'B'),
            data: {
                card: currentScheme.currentSide.toObj({player}),
                horizontal: true,
            },
        });
        await this.revealMainSchemeSide(currentScheme.currentSide, player);
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
            title: this.getMainSchemeDialogTitle(nextSchemeASide, 'A'),
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
            title: this.getMainSchemeDialogTitle(nextScheme.currentSide, 'B'),
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
            if (nextVillain.name === currentVillain.name) {
                nextVillain.owner = this;
                nextVillain.stunned = currentVillain.stunned;
                nextVillain.confused = currentVillain.confused;
                nextVillain.tough = currentVillain.tough;
                nextVillain.faceDown = currentVillain.faceDown;
                nextVillain.attached = currentVillain.attached;
                nextVillain.selectedSide = currentVillain.selectedSide;
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
    async toObjWithAbilityAvailability(player) {
        const scenario = this.toObj();

        return {
            ...scenario,
            villain: this.villain ?
                await this.villain.toObjWithAbilityAvailability(player) :
                null,
        };
    }
}