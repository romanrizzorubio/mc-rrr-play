import {ASPECT_BASIC} from "../aspects.js";
import {RESOURCE_ENERGY, RESOURCE_MENTAL, RESOURCE_PHYSICAL} from "../../../src/constants/resources.js";
import {CARD_TYPE_RESOURCE} from "../../../src/model/printed/resource-card.js";

const set = ASPECT_BASIC;
export const energy = {
    type: CARD_TYPE_RESOURCE,
    params: {
        name: 'Energy',
        set,
        image: 'aspect/basic/resources/b88-copy-2.webp',
        resources: [RESOURCE_ENERGY, RESOURCE_ENERGY],
        classification: set,
    }
};
export const genius = {
    type: CARD_TYPE_RESOURCE,
    params: {
        name: 'Genius',
        set,
        image: 'aspect/basic/resources/b89-copy-2.webp',
        resources: [RESOURCE_MENTAL, RESOURCE_MENTAL],
        classification: set,
    }
};
export const strength = {
    type: CARD_TYPE_RESOURCE,
    params: {
        name: 'Strength',
        set,
        image: 'aspect/basic/resources/b90-copy-2.webp',
        resources: [RESOURCE_PHYSICAL, RESOURCE_PHYSICAL],
        classification: set,
    }
};
