import {TIME_ROUND} from 'mc-shared';
import {Engine} from '../engine/engine.js';

import {Effect} from './effect.js';
import {PlayPlayersPhaseEffect} from './play-players-phase-effect.js';
import {PlayVillainPhaseEffect} from './play-villain-phase-effect.js';

export class PlayRoundEffect extends Effect {
    constructor() {
        super(arguments[0]);

        this.playing = false;

        this.playersPhase = new PlayPlayersPhaseEffect({
            match: this.match,
        });
        this.villainPhase = new PlayVillainPhaseEffect({
            match: this.match,
        });
    }
    async execute(params) {
        this.playing = true;

        Engine.currentRound = this;

        await this.playersPhase.runEffect(params);
        await this.villainPhase.runEffect(params);

        await this.endLimit(TIME_ROUND);
    }
}