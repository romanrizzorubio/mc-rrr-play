import {
    CLASSIFICATION_AGGRESSION,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_HERO,
    CLASSIFICATION_JUSTICE,
    CLASSIFICATION_LEADERSHIP,
    CLASSIFICATION_POOL,
    CLASSIFICATION_PROTECTION,
} from '../constants/classifications.js';

export const ASPECT_NAMES = {
    [CLASSIFICATION_AGGRESSION]: 'Agresividad',
    [CLASSIFICATION_JUSTICE]: 'Justicia',
    [CLASSIFICATION_LEADERSHIP]: 'Liderazgo',
    [CLASSIFICATION_PROTECTION]: 'Protección',
    [CLASSIFICATION_POOL]: 'Masacrismo',
};

export const ASPECT_IDS = Object.freeze(Object.keys(ASPECT_NAMES));
export const CARD_CLASSIFICATION_NAMES = {
    [CLASSIFICATION_BASIC]: 'Básica',
    [CLASSIFICATION_HERO]: 'Héroe',
};

export function translateAspect(aspect) {
    if (Array.isArray(aspect)) {
        return aspect.map(translateAspect).join(', ');
    }

    return Object.hasOwn(ASPECT_NAMES, aspect) ? ASPECT_NAMES[aspect] : aspect;
}

export function translateClassification(classification) {
    if (Array.isArray(classification)) {
        return classification.map(translateClassification).join(', ');
    }

    if (Object.hasOwn(CARD_CLASSIFICATION_NAMES, classification)) {
        return CARD_CLASSIFICATION_NAMES[classification];
    }

    return translateAspect(classification);
}
