import {Effect} from "./effect.js";
import {RevealEncounterEffect} from "./reveal-encounter-effect.js";

export const EFFECT_DISCARD_REVEAL = 'discard-reveal';
export class DiscardRevealEffect extends Effect {
    constructor({
        condition,
    }) {
        super(arguments[0]);

        this.condition = condition;

        this.cards = [];
    }
    async execute(params) {
        const {condition} = this;
        const {player} = params;

        const card = await this.match.discardUntil(condition, true)

        const revealEncounterEffect = new RevealEncounterEffect({
            selectedTarget: card,
            player,
            match: this.match,
        });

        await revealEncounterEffect.runEffect(params);
    }
}