import {
    CLASSIFICATION_JUSTICE,
    CARD_TYPE_RESOURCE,
    RESOURCE_WILD,
    TARGET_DECK
} from 'mc-shared';

export default [
    {
        '_id': 'justice-the-power-of-justice',
        'aspect': 'justice',
        'order': 4,
        'card': {
            'type': CARD_TYPE_RESOURCE,
            'params': {
                'name': 'El poder de la justicia',
                'set': CLASSIFICATION_JUSTICE,
                'image': 'aspect/justice/resources/01062.png',
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
                'maximum': {
                    'count': 2,
                    'target': TARGET_DECK
                },
                'classification': 'justice'
            }
        }
    }
];
