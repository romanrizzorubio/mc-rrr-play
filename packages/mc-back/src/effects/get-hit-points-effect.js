import {TRIGGER_YOUR_HERO_GET_HIT_POINTS} from 'mc-shared';

import {Effect} from './effect.js';

export class GetHitPointsEffect extends Effect {
    constructor({}) {
        super(arguments[0]);

        this.hitPoints = 0;
        this.modifyHitPoints = 0;
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([
                TRIGGER_YOUR_HERO_GET_HIT_POINTS,
            ]);
    }
    async execute(_params) {
        const {selectedTarget, modifyHitPoints} = this;

        this.hitPoints = selectedTarget.currentSide.hitPoints +
            selectedTarget.modifyHitPoints +
            modifyHitPoints;
    }
}
