import {RevealEncounterEffect} from "../../effects/reveal-encounter-effect.js";
import {GameZone} from "./game-zone.js";

export class ScenarioZone extends GameZone {
    constructor() {
        super(arguments[0]);

        this.currentVillain = null;
        this.currentScheme = null;
    }
    get accelerationTokens() {
        return super.accelerationTokens +
            this.currentVillain.currentSide.accelerationTokens +
            this.currentScheme.currentSide.accelerationTokens;
    }
    get hasCrisis() {
        return this.currentVillain.hasCrisis ||
            this.currentScheme.hasCrisis ||
            super.hasCrisis;
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

        revealEncounterEffect.selectedTarget = this.currentVillain
        await revealEncounterEffect.runEffect({player});
    }
}