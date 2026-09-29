import {ASPECT_JUSTICE} from "../aspects.js";
import {RESOURCE_WILD} from "../../../src/constants/resources.js";
import {CARD_TYPE_RESOURCE} from "../../../src/model/printed/resource-card.js";

const set = ASPECT_JUSTICE;
export const powerOfJustice = {
    type: CARD_TYPE_RESOURCE,
    params: {
        name: 'The Power of Justice',
        set,
        image: 'aspect/justice/resources/j62-copy.webp',
        resources: [{
            condition: {
                'card.set': ASPECT_JUSTICE,
            },
            resources: [RESOURCE_WILD, RESOURCE_WILD]
        }, {
            resources: [RESOURCE_WILD]
        }],
        classification: set,
    }
};
