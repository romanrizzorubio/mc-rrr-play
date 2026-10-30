import {RevealEncounterEffect} from './reveal-encounter-effect.js';

import {Effect} from './effect.js';

export class RevealFacedownUnderEffect extends Effect {
    constructor({name}) {
        super(arguments[0]);

        this.name = name;
    }
    async execute(params) {
        const host = this.selectedTarget?.parent ?? this.selectedTarget;
        const facedownCards = host.faceDown.filter(faceDown =>
            !this.name || faceDown.card.name === this.name);

        for (const faceDown of facedownCards) {
            const card = faceDown.card;
            faceDown.removeCard();
            const revealEffect = new RevealEncounterEffect({
                selectedTarget: card,
                match: this.match,
            });
            await revealEffect.runEffect(params);
        }
    }
}
