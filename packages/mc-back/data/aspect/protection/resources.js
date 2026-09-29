import {ASPECT_PROTECTION} from "../aspects.js";
import {RESOURCE_WILD} from "../../../src/constants/resources.js";
import {CARD_TYPE_RESOURCE} from "../../../src/model/printed/resource-card.js";

const set = ASPECT_PROTECTION;

export const powerOfProtection = {
    type: CARD_TYPE_RESOURCE,
    params: {
        name: 'El poder de la protección',
        set,
        image: 'aspect/protection/resources/01079.png',
        resources: [{
            condition: {
                'card.classification': set,
            },
            resources: [RESOURCE_WILD, RESOURCE_WILD]
        }, {
            resources: [RESOURCE_WILD]
        }],
        maximum: {
            count: 2,
        },
        classification: set,
    }
};

export const resources = [
    powerOfProtection,
];
