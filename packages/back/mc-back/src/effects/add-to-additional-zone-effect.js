import {Effect} from './effect.js';

export class AddToAdditionalZoneEffect extends Effect {
    constructor({
        zoneId,
        fromTopOfDeck = false,
        inPlayOnly = false,
    }) {
        super(arguments[0]);

        this.zoneId = zoneId;
        this.fromTopOfDeck = fromTopOfDeck;
        this.inPlayOnly = inPlayOnly;
    }
    filterTarget(target, params) {
        if (this.inPlayOnly) {
            const targets = Array.isArray(target) ?
                target.flat(Infinity) :
                [target];
            if (!targets.some(candidate => candidate?.isInPlay)) {
                return false;
            }
        }

        return super.filterTarget(target, params);
    }
    async canRun(params) {
        if (!await super.canRun(params)) {
            return false;
        }
        if (!this.fromTopOfDeck) {
            return true;
        }

        const targets = this.selectedTarget ?
            (Array.isArray(this.selectedTarget) ?
                this.selectedTarget.flat(Infinity) :
                [this.selectedTarget]) :
            (await this.getValidTarget(params)).flat(Infinity);

        for (const target of targets) {
            const player = target?.isPlayer ? target : params.player;
            const deck = player?.deck;
            if (deck?.isPlayerDeck) {
                await deck.checkCycle();
                if (deck.cards.length) {
                    return true;
                }
            }
        }

        return false;
    }
    async execute(params) {
        const targets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget.flat(Infinity) :
            [this.selectedTarget];

        for (const target of targets) {
            if (this.fromTopOfDeck) {
                const player = target?.isPlayer ? target : params.player;
                const deck = player?.deck;
                if (!deck?.isPlayerDeck) {
                    throw new Error(
                        'AddToAdditionalZoneEffect requires a player deck.'
                    );
                }

                await deck.checkCycle();
                const card = deck.cards[0];
                if (!card || !deck.removeCardFromDeck(card)) {
                    throw new Error(
                        'AddToAdditionalZoneEffect could not get a card from the player deck.'
                    );
                }

                await deck.checkCycle();
                await deck.refresh();
                await card.discard({
                    toAdditionalZoneId: this.zoneId,
                    player,
                    effect: this,
                });
            } else if (target?.discard &&
                (!this.inPlayOnly || target.isInPlay)) {
                await target.discard({
                    toAdditionalZoneId: this.zoneId,
                    player: params.player,
                    effect: this,
                });
            } else if (!this.inPlayOnly) {
                throw new TypeError(
                    'AddToAdditionalZoneEffect requires a game card.'
                );
            }
        }
    }
}
