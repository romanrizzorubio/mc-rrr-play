import {Effect} from "./effect.js";
import {RevealEncounterEffect} from "./reveal-encounter-effect.js";

export const EFFECT_REVEAL_FIRST_ENCOUNTER = 'reveal-first-encounter';
export class RevealFirstEncounterEffect extends Effect {
    async execute(params) {
        const {player} = params;

        const card = await this.match.drawEncounterCards();

        const revealEncounterEffect = new RevealEncounterEffect({
            selectedTarget: card.pop(),
            player,
            match: this.match,
        });

        await revealEncounterEffect.runEffect(params);
    }
}