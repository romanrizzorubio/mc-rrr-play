import {
    CARD_TYPE_ALLY,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_ENVIRONMENT,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_SUPERHERO,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CARD_TYPE_VILLAIN,
} from 'mc-shared';

const CARD_TYPE_LABELS = new Map([
    [CARD_TYPE_ALLY, 'Aliado'],
    [CARD_TYPE_ALTEREGO, 'Alter ego'],
    [CARD_TYPE_ATTACHMENT, 'Accesorio'],
    [CARD_TYPE_ENVIRONMENT, 'Entorno'],
    [CARD_TYPE_EVENT, 'Evento'],
    [CARD_TYPE_HERO, 'Héroe'],
    [CARD_TYPE_MAIN_SCHEME_A_CARD, 'Plan principal (cara A)'],
    [CARD_TYPE_MAIN_SCHEME_B_CARD, 'Plan principal (cara B)'],
    [CARD_TYPE_MINION, 'Esbirro'],
    [CARD_TYPE_OBLIGATION, 'Obligación'],
    [CARD_TYPE_RESOURCE, 'Recurso'],
    [CARD_TYPE_SIDE_SCHEME_SCENARIO, 'Plan secundario'],
    [CARD_TYPE_SUPERHERO, 'Superhéroe'],
    [CARD_TYPE_SUPPORT, 'Apoyo'],
    [CARD_TYPE_TREACHERY, 'Perfidia'],
    [CARD_TYPE_UPGRADE, 'Mejora'],
    [CARD_TYPE_VILLAIN, 'Villano'],
]);

export const getCardTypeLabel = cardType => {
    const label = CARD_TYPE_LABELS.get(cardType);
    if (!label) {
        throw new RangeError(`Unsupported card type: ${cardType}`);
    }

    return label;
};

export const sortCardTypeOptions = options =>
    [...options].sort((left, right) =>
        getCardTypeLabel(left.cardType).localeCompare(
            getCardTypeLabel(right.cardType),
            'es',
            {sensitivity: 'base'}
        ));
