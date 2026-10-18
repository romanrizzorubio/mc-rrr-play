import {
    DIALOG_SURGE,
    PLACE_ENCOUNTER_DECK,
    PRIORITY_INTERRUPT,
    TRIGGER_SURGE,
} from 'mc-shared';

import {Effect} from './effect.js';
import {GetEncounterCardEffect} from './get-encounter-card-effect.js';

export class ResolveSurgeEffect extends Effect {
    constructor(params = {}) {
        super(params);
        this.card = undefined;
    }
    async prepare() {}
    async execute(params) {
        await this.trigger(
            PRIORITY_INTERRUPT,
            [TRIGGER_SURGE],
            {
                ...params,
                effect: this,
            }
        );

        if (!this.match.skipSurgeNotification) {
            const response = await this.openDialog({
                dialogType: DIALOG_SURGE,
                title: 'Oleada',
                subtitle: 'Se resuelve una Oleada: se revela y resuelve una carta adicional del mazo de Encuentros.',
                data: {
                    allowHideFuture: true,
                },
            });

            if (response?.skipSurgeNotification) {
                this.match.skipSurgeNotification = true;
            }
        }

        const getEncounterCardEffect = new GetEncounterCardEffect({
            from: PLACE_ENCOUNTER_DECK,
            match: this.match,
        });
        if (await getEncounterCardEffect.canRun(params)) {
            await getEncounterCardEffect.runEffect(params);
            this.card = getEncounterCardEffect.card;
        }
    }
}
