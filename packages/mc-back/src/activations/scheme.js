
import {TRIGGER_VILLAIN_SCHEMES} from '../constants/triggers.js';

import {Activation} from './activation.js';

export class Scheme extends Activation {
    checkStatus() {
        const {character} = this;

        return !character.isConfused;
    }
    filterTarget(card, {player}) {
        return card.canScheme(player);
    }
    getTargetDialog(params) {
        const {player} = params;

        return player.superhero.currentSide;
    }
    getTitleDialog(params) {
        const {character} = this;
        const target = this.getTargetDialog(params);

        return `${character.name} planifica contra ${target.name}`;
    }
    getTriggersInit(params) {
        const {triggersInitLaunched} = this;

        return !triggersInitLaunched ? super.getTriggersInit(params)
            .concat([
                TRIGGER_VILLAIN_SCHEMES,
            ]) : [];
    }
    resolveStatus() {
        const {character} = this;

        character.removeConfused();

        character.refresh();
    }
}