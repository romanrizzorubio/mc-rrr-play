import {Activation} from "./activation.js";
import {TRIGGER_THIS_THWARTS} from "../triggers/this-thwarts-trigger.js";

export class Thwart extends Activation {
    checkStatus() {
        const {character} = this;

        return !character.isConfused;
    }
    filterTarget(card, params) {
        const {player} = params;

        if (card.isCard) {
            return card.canThwart(player)
        }

        return player.canThwart(params);
    }
    getTriggersEnds(params) {
        const {triggersEndsLaunched} = this;

        return !triggersEndsLaunched && this.activationEnd ? super.getTriggersEnds(params)
            .concat([
                TRIGGER_THIS_THWARTS,
            ]) : [];
    }
    resolveStatus() {
        const {character} = this;

        character.removeConfused();

        character.refresh();
    }
}