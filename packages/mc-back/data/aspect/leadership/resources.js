import {RESOURCE_WILD} from '../../../src/constants/resources.js';
import {CARD_TYPE_RESOURCE} from '../../../src/model/printed/resource-card.js';
import {ASPECT_LEADERSHIP} from '../aspects.js';

const set = ASPECT_LEADERSHIP;

export const powerOfLeadership = {
    type: CARD_TYPE_RESOURCE,
    params: {
        name: 'El poder del liderazgo',
        set,
        image: 'aspect/leadership/resources/01072.png',
        resources: [{
            condition: {
                'card.set': set,
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
    powerOfLeadership
];
