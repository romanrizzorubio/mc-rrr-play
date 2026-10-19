import {
    DECK_POSITION_SHUFFLE,
    PLACE_HAND,
    TARGET_CARD,
} from 'mc-shared';
import {ValidTarget} from '../targets/valid-target.js';
import {MoveToDeckEffect} from './move-to-deck-effect.js';

import {Effect} from './effect.js';

export class ReturnFaceDownEffect extends Effect {
    constructor({
        faceDownTarget = TARGET_CARD,
        selectedFaceDown,
        selectCount,
        selectUpTo = false,
        destination = PLACE_HAND,
    }) {
        super(arguments[0]);

        this.faceDownTarget = faceDownTarget;
        this.selectedFaceDown = selectedFaceDown;
        this.selectCount = selectCount;
        this.selectUpTo = selectUpTo;
        this.destination = destination;
    }
    getDestination(faceDown, params) {
        if (this.destination === PLACE_HAND) {
            return PLACE_HAND;
        }

        if (!this.destination ||
            typeof this.destination !== 'object' ||
            typeof this.destination.target !== 'string') {
            throw new TypeError('ReturnFaceDownEffect destination must be a place or target configuration.');
        }

        const validTarget = new ValidTarget({
            match: this.match,
        });
        const owner = faceDown.card.owner;
        const targets = validTarget.getTargetCandidates({
            ...params,
            player: owner,
            effect: this.destination,
        }, this.destination.target);

        if (targets.length !== 1) {
            throw new Error('ReturnFaceDownEffect destination must resolve to one target.');
        }

        return targets[0];
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
    async execute(params) {
        const {selectedFaceDown, selectedTarget} = this;
        const faceDownCards = Array.isArray(selectedFaceDown) ?
            selectedFaceDown :
            selectedFaceDown ? [selectedFaceDown] : [];
        const owners = new Set();
        const decks = new Set();

        await this.promisesSequential(faceDownCards, async faceDown => {
            const destination = this.getDestination(faceDown, params);
            if (destination === PLACE_HAND) {
                owners.add(faceDown.card.owner);
                faceDown.returnToOwnerHand();
                return;
            }

            faceDown.removeCard();
            const moveToDeck = new MoveToDeckEffect({
                selectedTarget: destination,
                cards: [faceDown.card],
                position: this.destination.position ?? DECK_POSITION_SHUFFLE,
                match: this.match,
            });
            await moveToDeck.runEffect(params);
            decks.add(destination);
        });

        await selectedTarget.refresh();
        await this.promisesSequential([...owners].filter(Boolean), owner =>
            owner.hand.refresh());
        await this.promisesSequential([...decks], deck => deck.refresh());
    }
}