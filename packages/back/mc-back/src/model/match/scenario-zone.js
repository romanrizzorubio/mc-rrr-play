import {RevealEncounterEffect} from '../../effects/reveal-encounter-effect.js';

import {GameZone} from './game-zone.js';

export class ScenarioZone extends GameZone {
    constructor() {
        super(arguments[0]);

        this.currentVillain = null;
        this.currentScheme = null;
    }
    async refresh() {
        await super.refresh();

        if (this.currentVillain) {
            await this.currentVillain.refresh();
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
            this.currentVillain.currentSide.accelerationTokens +
            this.currentScheme.currentSide.accelerationTokens;
    }
    get objectToRefresh() {
        return 'scenarioZone';
    }
    get schemes() {
        const schemes = this.sideSchemes;
        schemes.unshift(this.currentScheme.currentSide);

        return schemes;
    }
    get sideSchemes() {
        return this.cards.filter(card => card.isScheme);
    }
    async resolveWhenReveal(player) {
        const revealEncounterEffect = new RevealEncounterEffect({
            selectedTarget: this.currentScheme,
            match: this.match,
        });
        await revealEncounterEffect.runEffect({player});

        revealEncounterEffect.selectedTarget = this.currentVillain;
        await revealEncounterEffect.runEffect({player});
    }
}