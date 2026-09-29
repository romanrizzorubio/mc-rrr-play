import {Effect} from "./effect.js";
import {endpoints} from "../constants/endpoints.js";

export class PlayTurnEffect extends Effect {
    execute({player}) {
        return new Promise(resolve => {
            const {match} = this;

            match.currentPlayer = player;

            match.refresh();

            match.listen(endpoints.turn.end, resolve, true);
        })
    }
}