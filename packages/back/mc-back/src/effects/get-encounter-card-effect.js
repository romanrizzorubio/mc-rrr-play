import {
    PLACE_PLAYER_ENCOUNTERS,
    PLACE_SCENARIO_EXTRA_DECK,
} from 'mc-shared';

import {path} from '../engine/utils.js';
import {ENCOUNTER_CARD_SOURCE_HANDLERS} from './encounter-card-source-handlers.js';
import {Effect} from './effect.js';

export class GetEncounterCardEffect extends Effect {
    constructor(params = {}) {
        const {
            from = PLACE_PLAYER_ENCOUNTERS,
            deckId,
            cardSource,
        } = params;
        super(params);

        if (!ENCOUNTER_CARD_SOURCE_HANDLERS.has(from)) {
            throw new Error(`Unsupported encounter card source: ${from}`);
        }
        if (from === PLACE_SCENARIO_EXTRA_DECK &&
            (typeof deckId !== 'string' || !deckId)) {
            throw new Error('An extra scenario deck ID is required to get a card from it.');
        }

        this.from = from;
        this.deckId = deckId;
        this.cardSource = cardSource;
        this.card = undefined;
    }
    get sourceHandler() {
        const handler = ENCOUNTER_CARD_SOURCE_HANDLERS.get(this.from);
        if (!handler) {
            throw new Error(`Unsupported encounter card source: ${this.from}`);
        }

        return handler;
    }
    getEncounterDeck() {
        return this.match.scenario.deck;
    }
    getExtraDeck() {
        return this.match.scenario.getExtraDeck(this.deckId);
    }
    getSourceCard(params) {
        if (this.cardSource === undefined) {
            return undefined;
        }

        const source = typeof this.cardSource === 'string' ?
            path(params, this.cardSource) :
            this.cardSource;

        return Array.isArray(source) ?
            source.find(card => this.hasSourceCard(card, params)) :
            source;
    }
    hasSourceCard(card, params) {
        return Boolean(
            card?.isEncounterCard &&
            this.sourceHandler.hasCard(this, card, params)
        );
    }
    async canRun(params) {
        if (this.cardSource !== undefined) {
            return this.hasSourceCard(this.getSourceCard(params), params);
        }

        return this.sourceHandler.canGet(this, params);
    }
    async prepare() {}
    async takeSourceCard(card, params) {
        if (!this.hasSourceCard(card, params)) {
            throw new Error('The encounter card is no longer in its configured source.');
        }

        await this.sourceHandler.take(this, card, params);

        return card;
    }
    async execute(params) {
        if (this.cardSource !== undefined) {
            this.card = await this.takeSourceCard(
                this.getSourceCard(params),
                params
            );

            return;
        }

        this.card = await this.sourceHandler.get(this, params);

        if (!this.card?.isEncounterCard) {
            throw new Error(`No encounter card is available from ${this.from}.`);
        }
    }
}
