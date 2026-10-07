import {DIALOG_ACCELERATE,TARGET_MAIN_SCHEME} from 'mc-shared';

import {Effect} from './effect.js';
import {PlaceThreatEffect} from './place-threat-effect.js';

export class AccelerateSchemeEffect extends Effect {
    constructor() {
        super(arguments[0]);

        this.target = TARGET_MAIN_SCHEME;
    }
    async prepare(params) {
        const mainScheme = this.match.mainScheme;
        const {accelerationValue} = mainScheme;
        const {accelerationIcons, accelerationTokens} = this.match;
        const accelerate = accelerationValue + accelerationIcons + accelerationTokens;
        await this.openDialog({
            dialogType: DIALOG_ACCELERATE,
            data: {
                cards: [mainScheme.toObj(arguments[0])],
                accelerate: accelerate,
                accelerateBase: accelerationValue,
                accelerateIcons: accelerationIcons,
                accelerateTokens: accelerationTokens,
            },
        });

        return super.prepare(params);
    }
    execute(params) {
        const {match, selectedTarget} = this;
        const threat = selectedTarget.accelerationValue + match.accelerationPlus;

        const placeThreatEffect = new PlaceThreatEffect({
            isAccelerationThreat: true,
            selectedTarget,
            threat,
            match: this.match,
        });

        return placeThreatEffect.runEffect({
            ...params,
            selectedTarget,
            effect: this,
        });
    }
}