import {
    EFFECT_CHAINED,
    EFFECT_GET_ENCOUNTER_CARD,
    EFFECT_REVEAL_ENCOUNTER,
} from 'mc-shared';

export const revealEncounterFrom = ({
    from,
    deckId,
    cardSource,
    revealParams = {},
}) => ({
    type: EFFECT_CHAINED,
    params: {
        effects: [
            {
                type: EFFECT_GET_ENCOUNTER_CARD,
                params: {
                    from,
                    ...(deckId ? {deckId} : {}),
                    ...(cardSource !== undefined ? {cardSource} : {}),
                },
            },
            {
                type: EFFECT_REVEAL_ENCOUNTER,
                params: {
                    ...revealParams,
                    card: 'effects.0.card',
                },
            },
        ],
    },
});
