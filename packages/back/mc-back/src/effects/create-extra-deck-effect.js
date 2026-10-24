import {Effect} from './effect.js';

export class CreateExtraDeckEffect extends Effect {
    constructor(params = {}) {
        const {
            deckId,
            cardCondition,
            collectCondition,
            name,
            hasDiscard,
        } = params;
        super(params);

        if (typeof deckId !== 'string' || !deckId) {
            throw new TypeError('CreateExtraDeckEffect requires a deck ID.');
        }
        if (cardCondition !== undefined &&
            (!cardCondition || typeof cardCondition !== 'object' ||
                Array.isArray(cardCondition) || Object.keys(cardCondition).length === 0)) {
            throw new TypeError(
                'CreateExtraDeckEffect cardCondition must be a non-empty object.'
            );
        }
        if (name !== undefined && (typeof name !== 'string' || !name)) {
            throw new TypeError('CreateExtraDeckEffect name must be a non-empty string.');
        }
        if (collectCondition !== undefined &&
            (!collectCondition || typeof collectCondition !== 'object' ||
                Array.isArray(collectCondition) ||
                Object.keys(collectCondition).length === 0)) {
            throw new TypeError(
                'CreateExtraDeckEffect collectCondition must be a non-empty object.'
            );
        }
        if (hasDiscard !== undefined && typeof hasDiscard !== 'boolean') {
            throw new TypeError('CreateExtraDeckEffect hasDiscard must be a boolean.');
        }
        this.deckId = deckId;
        this.cardCondition = cardCondition;
        this.collectCondition = collectCondition;
        this.name = name;
        this.hasDiscard = hasDiscard;
    }
    async canRun() {
        return Boolean(this.match?.scenario);
    }
    async prepare() {}
    async execute() {
        const scenario = this.match?.scenario;
        if (typeof scenario?.createExtraDeck !== 'function') {
            throw new TypeError('CreateExtraDeckEffect requires a scenario that can create extra decks.');
        }

        await scenario.createExtraDeck(this.deckId, {
            cardCondition: this.cardCondition,
            collectCondition: this.collectCondition,
            name: this.name,
            hasDiscard: this.hasDiscard,
        });
    }
}
