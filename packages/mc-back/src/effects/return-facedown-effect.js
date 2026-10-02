import { TARGET_CARD} from 'mc-shared';
import {ValidTarget} from '../targets/valid-target.js';

import {Effect} from './effect.js';

export class ReturnFaceDownEffect extends Effect {
    constructor({
        faceDownTarget = TARGET_CARD,
        selectedFaceDown,
    }) {
        super(arguments[0]);

        this.faceDownTarget = faceDownTarget;
        this.selectedFaceDown = selectedFaceDown;
    }
    async prepare(params) {
        await super.prepare(params);

        const {selectedTarget, faceDownTarget} = this;

        const validTarget = new ValidTarget({
            match: this.match,
        });

        this.selectedFaceDown = await validTarget.selectTarget({
            ...params,
            target: faceDownTarget,
            cards: selectedTarget.faceDown,
        });
    }
    async execute() {
        const {selectedFaceDown} = this;

        await this.promisesSequential(selectedFaceDown, faceDown => {
            faceDown.returnToOwnerHand();
        });

        selectedFaceDown.refresh();
    }
}