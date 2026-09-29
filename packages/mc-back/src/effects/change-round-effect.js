import {Effect} from "./effect.js";
import {PlayPlayersPhaseEffect} from "./play-players-phase-effect.js";
import {PlayVillainPhaseEffect} from "./play-villain-phase-effect.js";
import {Engine} from "../engine/engine.js";

export class ChangeRoundEffect extends Effect {
    async execute(params) {
        const {match} = this;

        let index = match.players.indexOf(this.currentPlayer);

        if (++index >= match.players.length) {
            index = 0;
        }

        match.currentPlayer.initial = false;
        match.currentPlayer.refresh();

        match.currentPlayer = match.players[index];
        match.currentPlayer.initial = true;

        match.currentPlayer.refresh();
    }
}