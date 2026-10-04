import {
    CARD_TYPE_RESOURCE,
    RESOURCE_WILD
} from 'mc-shared';

export default [
    {
        '_id': 'justice-the-power-of-justice',
        'aspect': 'justice',
        'order': 4,
        'card': {
            'type': CARD_TYPE_RESOURCE,
            'params': {
                'name': 'The Power of Justice',
                'set': 'justice',
                'image': 'aspect/justice/resources/j62-copy.webp',
                'resources': [
                    {
                        'condition': {
                            'card.set': 'justice'
                        },
                        'resources': [
                            RESOURCE_WILD,
                            RESOURCE_WILD
                        ]
                    },
                    {
                        'resources': [
                            RESOURCE_WILD
                        ]
                    }
                ],
                'classification': 'justice'
            }
        }
    }
];
