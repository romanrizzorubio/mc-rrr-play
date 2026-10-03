import {TIME_ROUND, TRIGGER_ROUND_ENDS} from 'mc-shared';
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
    getTriggersEnds() {
        return super.getTriggersEnds()
            .concat([
                TRIGGER_ROUND_ENDS,
            ]);
    }
    async execute(params) {
        this.playing = true;

        Engine.currentRound = this;

        if (this.match.phase !== 'villain') {
            this.match.phase = 'players';
            await this.playersPhase.runEffect(params);
            this.match.phase = 'villain';
            this.match.villainPhaseStep = 0;
            await this.match.persist();
        }
        await this.villainPhase.runEffect(params);

        this.match.phase = 'round-complete';
        this.match.villainPhaseStep = 0;
        this.match.turnIndex = 0;
        await this.endLimit(TIME_ROUND);
        await this.match.persist();
    }
}