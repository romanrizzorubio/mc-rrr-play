import {
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
} from 'mc-shared';

const RESOURCE_NAMES = {
    [RESOURCE_ANY]: 'cualquiera',
    [RESOURCE_ENERGY]: 'energía',
    [RESOURCE_MENTAL]: 'mental',
    [RESOURCE_PHYSICAL]: 'físico',
    [RESOURCE_WILD]: 'universal',
};

export function getResourceName(resource) {
    return RESOURCE_NAMES[resource] || resource;
}
