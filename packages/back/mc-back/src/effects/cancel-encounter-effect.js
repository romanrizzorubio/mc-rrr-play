import {CARD_TYPE_ANY, CARD_TYPE_TREACHERY} from 'mc-shared';

import {Effect} from './effect.js';
import {
    CANCEL_ENCOUNTER_FULL,
    CANCEL_ENCOUNTER_NOT,
    CANCEL_ENCOUNTER_REVEAL,
} from './cancel-encounter-constants.js';

export {
    CANCEL_ENCOUNTER_FULL,
    CANCEL_ENCOUNTER_NOT,
    CANCEL_ENCOUNTER_REVEAL,
};

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
            case CARD_TYPE_ANY:
                return card?.isEncounterCard === true;
            case CARD_TYPE_TREACHERY:
                return card.isTreachery;
        }

        return false;
    }
    canRun(params) {
        const effect = params.effect;
        const selectedCard = effect?.selectedTarget;

        return Boolean(selectedCard) &&
            !selectedCard.hasUncancellableAbilities &&
            this.matchType(selectedCard) &&
            effect?.canceled === CANCEL_ENCOUNTER_NOT;
    }
    execute(_params) {
        const {selectedTarget} = this;

        selectedTarget.canceled = CANCEL_ENCOUNTER_REVEAL;

        if (this.full) {
            selectedTarget.canceled = CANCEL_ENCOUNTER_FULL;
        }
    }
}