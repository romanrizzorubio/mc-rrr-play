import { TARGET_CARD} from 'mc-shared';
import {ValidTarget} from '../targets/valid-target.js';

import {Effect} from './effect.js';

export class ReturnFaceDownEffect extends Effect {
    constructor({
        faceDownTarget = TARGET_CARD,
        selectedFaceDown,
        selectCount,
        selectUpTo = false,
    }) {
        super(arguments[0]);

        this.faceDownTarget = faceDownTarget;
        this.selectedFaceDown = selectedFaceDown;
        this.selectCount = selectCount;
        this.selectUpTo = selectUpTo;
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
            selectCount: this.selectCount,
            selectUpTo: this.selectUpTo,
        });
    }
    async execute() {
        const {selectedFaceDown, selectedTarget} = this;
        const faceDownCards = Array.isArray(selectedFaceDown) ?
            selectedFaceDown :
            selectedFaceDown ? [selectedFaceDown] : [];
        const owners = new Set();

        faceDownCards.forEach(faceDown => owners.add(faceDown.card.owner));
        await this.promisesSequential(faceDownCards, faceDown => {
            faceDown.returnToOwnerHand();
        });

        await selectedTarget.refresh();
        await this.promisesSequential([...owners].filter(Boolean), owner =>
            owner.hand.refresh());
    }
}