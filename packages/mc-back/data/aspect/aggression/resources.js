import {RESOURCE_WILD} from '../../../src/constants/resources.js';
import {CARD_TYPE_RESOURCE} from '../../../src/model/printed/resource-card.js';
import {ASPECT_AGGRESSION} from '../aspects.js';

const set = ASPECT_AGGRESSION;
export const powerOfAggression = {
    type: CARD_TYPE_RESOURCE,
    params: {
        name: 'The Power of Aggression',
        set,
        image: 'aspect/aggression/resources/a55-copy.webp',
        resources: [{
            condition: {
                'card.set': ASPECT_AGGRESSION,
            },
            resources: [RESOURCE_WILD, RESOURCE_WILD]
        }, {
            resources: [RESOURCE_WILD]
        }],
        classification: set,
    }
};
