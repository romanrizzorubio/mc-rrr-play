import {ASPECT_NAMES, translateAspect} from 'mc-shared';

export {ASPECT_NAMES};

const CARD_TYPE_NAMES = {
    ally: 'Aliado',
    attachment: 'Accesorio',
    event: 'Evento',
    resource: 'Recurso',
    support: 'Apoyo',
    upgrade: 'Mejora',
};

const RESOURCE_NAMES = {
    e: 'Energía',
    m: 'Mental',
    p: 'Físico',
    w: 'Universal',
};

export function getAspectName(aspect) {
    return translateAspect(aspect);
}

export function getAspectClass(aspect) {
    return Object.hasOwn(ASPECT_NAMES, aspect) ? `aspect-${aspect}` : '';
}

export function getCardTypeName(type) {
    return CARD_TYPE_NAMES[type] || type || 'Otros';
}

export function getCardOriginName(card) {
    if (card.fixed) {
        return 'Héroe';
    }

    return getAspectName(card.aspect);
}

export function getResourceName(resource) {
    return RESOURCE_NAMES[resource] || resource;
}

export function getCardImageUrl(card) {
    const getAssetUrl = window.mcStaticRemote?.getAssetUrl;

    return card.image && typeof getAssetUrl === 'function' ?
        getAssetUrl(`images/cards/${card.image}`) :
        '';
}
