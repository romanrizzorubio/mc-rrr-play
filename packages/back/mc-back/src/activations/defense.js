import {Activation} from './activation.js';

export class Defense extends Activation {
    filterTarget(_card, params) {
        const {player} = params;

        return player.canDefend(params);
    }
}