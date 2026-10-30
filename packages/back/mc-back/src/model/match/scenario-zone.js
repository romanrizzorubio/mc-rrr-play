import {RevealEncounterEffect} from '../../effects/reveal-encounter-effect.js';

import {GameZone} from './game-zone.js';

export class ScenarioZone extends GameZone {
    constructor({id, ...params} = {}) {
        super(params);

        this.id = id;
        this.players = [];
        this.currentVillain = null;
        this.currentScheme = null;
    }
    addPlayer(player) {
        if (player.scenarioZone && player.scenarioZone !== this) {
            player.scenarioZone.removePlayer(player);
        }
        if (!this.players.includes(player)) {
            this.players.push(player);
        }
        player.scenarioZone = this;
    }
    removePlayer(player) {
        const index = this.players.indexOf(player);
        if (index >= 0) {
            this.players.splice(index, 1);
        }
        if (player.scenarioZone === this) {
            player.scenarioZone = undefined;
        }
    }
    addVillain(villain) {
        if (this.currentVillain && this.currentVillain !== villain) {
            this.currentVillain.endTriggers();
        }
        this.currentVillain = villain;
        villain.scenarioZone = this;
    }
    addScheme(scheme) {
        if (this.currentScheme && this.currentScheme !== scheme) {
            this.currentScheme.endTriggers();
        }
        this.currentScheme = scheme;
        scheme.scenarioZone = this;
    }
    addToGameZone(card) {
        super.addToGameZone(card);
        card.scenarioZone = this;
    }
    async refresh() {
        await super.refresh();

        if (this.currentVillain) {
            await this.currentVillain.refresh();
        }
        if (this.currentScheme) {
            await this.currentScheme.refresh();
        }
    }
    get inPlayCards() {
        return [...new Set([
            ...super.inPlayCards,
            this.currentVillain,
            this.currentScheme,
        ].filter(Boolean))];
    }
    get accelerationTokens() {
        return super.accelerationTokens +
            (this.currentVillain?.currentSide.accelerationTokens ?? 0) +
            (this.currentScheme?.currentSide.accelerationTokens ?? 0);
    }
    get objectToRefresh() {
        return 'scenarioZone';
    }
    get schemes() {
        const schemes = this.sideSchemes;
        if (this.currentScheme) {
            schemes.unshift(this.currentScheme.currentSide);
        }

        return schemes;
    }
    get sideSchemes() {
        return this.cards.filter(card => card.isScheme);
    }
    async resolveWhenReveal(player) {
        if (!this.currentScheme || !this.currentVillain) {
            return;
        }

        const revealEncounterEffect = new RevealEncounterEffect({
            selectedTarget: this.currentScheme,
            match: this.match,
        });
        await revealEncounterEffect.runEffect({player});

        revealEncounterEffect.selectedTarget = this.currentVillain;
        await revealEncounterEffect.runEffect({player});
    }
    toObj() {
        return {
            ...super.toObj(arguments[0]),
            id: this.id,
            players: this.players.map(player => player.name),
            villain: this.currentVillain?.toObj(arguments[0]),
            mainScheme: this.currentScheme?.currentSide?.toObj(arguments[0]),
        };
    }
    async toObjWithAbilityAvailability(player) {
        const [gameZone, villain, mainScheme] = await Promise.all([
            super.toObjWithAbilityAvailability(player),
            this.currentVillain ?
                this.currentVillain.toObjWithAbilityAvailability(player) :
                null,
            this.currentScheme ?
                this.currentScheme.toObjWithAbilityAvailability(player) :
                null,
        ]);

        return {
            ...gameZone,
            id: this.id,
            players: this.players.map(zonePlayer => zonePlayer.name),
            villain,
            mainScheme,
        };
    }
}