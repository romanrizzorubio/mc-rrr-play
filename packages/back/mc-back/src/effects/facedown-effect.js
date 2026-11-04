import {PLACE_DECK, TARGET_CARD} from 'mc-shared';
import {ValidTarget} from '../targets/valid-target.js';
import {removeFromPlace} from '../utils/card-place-utils.js';

import {Effect} from './effect.js';

export class FaceDownEffect extends Effect {
    constructor({
        cards,
        count,
        cardsTarget = TARGET_CARD,
        from,
    }) {
        super(arguments[0]);

        this.cards = cards;
        this.count = count;
        this.cardsTarget = cardsTarget;
        this.from = from;
        this.topDeckCards = undefined;
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.topDeckCards = undefined;
    }
    async prepare(params) {
        await super.prepare(params);

        if (this.from === PLACE_DECK && this.count !== undefined) {
            if (!Number.isSafeInteger(this.count) || this.count < 0) {
                throw new TypeError(
                    'FaceDownEffect deck count must be a non-negative integer.'
                );
            }

            const deckCards = params.player?.deck?.cards;
            if (!Array.isArray(deckCards)) {
                throw new TypeError(
                    'FaceDownEffect from PLACE_DECK requires a player deck.'
                );
            }

            this.topDeckCards = deckCards.slice(0, this.count);
            return;
        }

        const {cardsTarget} = this;
        const validTarget = new ValidTarget({
            multipleTarget: true,
            match: this.match,
        });

        if (!this.cards?.length) {
            this.cards = await validTarget.selectTarget({
                ...params,
                target: cardsTarget,
                source: this.source,
            });
        }
    }
    async execute(params) {
        const {selectedTarget} = this;
        const cards = this.topDeckCards ?? this.cards;
        const selectedCards = Array.isArray(cards) ?
            cards :
            cards ? [cards] : [];
        const owners = new Set();
        let sourceDeck;

        if (this.from) {
            const remove = removeFromPlace.get(this.from);
            if (!remove) {
                throw new Error(
                    `Unsupported facedown card source: ${this.from}`
                );
            }

            sourceDeck = await remove(this, selectedCards, params.player);
        }

        if (!selectedCards.length) {
            await sourceDeck?.checkCycle?.();
            await sourceDeck?.refresh();

            return;
        }

        selectedCards.forEach(card => {
            const owner = card.owner;
            if (!this.from && owner?.hand?.cards.includes(card)) {
                owner.hand.discardHand(card);
                owners.add(owner);
            }
        });

        selectedTarget.addFaceDown(selectedCards);

        await sourceDeck?.checkCycle?.();
        await sourceDeck?.refresh();

        await this.promisesSequential([...owners], owner => owner.hand.refresh());
        const refreshTarget = selectedTarget.gameZone || selectedTarget;
        await refreshTarget.refresh();
    }
}