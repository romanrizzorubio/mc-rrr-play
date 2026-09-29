import {Effect} from "./effect.js";
import {CARD_TYPE_TREACHERY} from "../model/printed/treachery-card.js";

export const CANCEL_ENCOUNTER_FULL = 'full';
export const CANCEL_ENCOUNTER_NOT = 'not';
export const CANCEL_ENCOUNTER_REVEAL = 'reveal';

export const EFFECT_CANCEL_ENCOUNTER = 'cancel-encounter';
export class CancelEncounterEffect extends Effect {
    constructor({
        type = CARD_TYPE_TREACHERY,
        full = false,
    }) {
        super(arguments[0]);

        this.type = type;
        this.full = full;
    }
    matchType(card) {
        const {type} = this;

        switch (type) {
            case CARD_TYPE_TREACHERY:
                return card.isTreachery;
        }

        return false;
    }
    canRun(params) {
        const {effect} = params;

        return this.matchType(effect.selectedTarget) &&
            effect.canceled === CANCEL_ENCOUNTER_NOT;
    }
    execute(params) {
        const {selectedTarget} = this;

        selectedTarget.canceled = CANCEL_ENCOUNTER_REVEAL;

        if (this.full) {
            selectedTarget.canceled = CANCEL_ENCOUNTER_FULL;
        }
    }
}