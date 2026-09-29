import {Activation} from "./activation.js";

export class Defense extends Activation {
    filterTarget(card, params) {
        const {player} = params;

        if (card.isCard) {
            return card.canDefend(player)
        }

        return player.canDefend(params);
    }
}