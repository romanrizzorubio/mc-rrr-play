
import {
    TRIGGER_THIS_THWARTS,
    TRIGGER_YOU_ANY_THWART,
    TRIGGER_YOU_BASIC_THWART
} from 'mc-shared';

import {Activation} from './activation.js';

export class Thwart extends Activation {
    checkStatus() {
        const {character} = this;

        return !character.isConfused;
    }
    filterTarget(card, params) {
        const {player} = params;

        if (card.isCard) {
            return card.canThwart(player);
        }

        return player.canThwart(params);
    }
    getTriggersEnds(params) {
        const {triggersEndsLaunched, effect} = this;
        const isBasic = effect && effect.ability && effect.ability.isBasic;

        const triggers = [
            TRIGGER_THIS_THWARTS,
            TRIGGER_YOU_ANY_THWART,
        ];

        if (isBasic) {
            triggers.push(TRIGGER_YOU_BASIC_THWART);
        }

        return !triggersEndsLaunched ? super.getTriggersEnds(params)
            .concat(triggers) : [];
    }
    getTriggersParams(params) {
        const {character} = this;

        return {
            ...super.getTriggersParams(params),
            card: character,
        };
    }
    resolveStatus() {
        const {character} = this;

        character.removeConfused();

        character.refresh();
    }
}