import {
    CARD_TYPE_RESOURCE,
    RESOURCE_WILD,
    TARGET_DECK
} from 'mc-shared';

export default [
    {
        '_id': 'protection-el-poder-de-la-proteccion',
        'aspect': 'protection',
        'order': 4,
        'card': {
            'type': CARD_TYPE_RESOURCE,
            'params': {
                'name': 'El poder de la protección',
                'set': 'protection',
                'image': 'aspect/protection/resources/01079.png',
                'resources': [
                    {
                        'condition': {
                            'card.classification': 'protection'
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
                'classification': 'protection'
            }
        }
    }
];
