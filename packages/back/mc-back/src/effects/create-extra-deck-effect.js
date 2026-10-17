import {Effect} from './effect.js';

export class CreateExtraDeckEffect extends Effect {
    constructor(params = {}) {
        const {deckId} = params;
        super(params);

        if (typeof deckId !== 'string' || !deckId) {
            throw new TypeError('CreateExtraDeckEffect requires a deck ID.');
        }

        this.deckId = deckId;
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

        await scenario.createExtraDeck(this.deckId);
    }
}
