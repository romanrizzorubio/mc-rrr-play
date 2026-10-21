import {
    CARD_TYPE_RESOURCE,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_DECK,
} from 'mc-shared';

export default [
    {
        '_id': 'basic-energy',
        'aspect': 'basic',
        'order': 5,
        'card': {
            'type': CARD_TYPE_RESOURCE,
            'params': {
                'name': 'Energía',
                'set': 'basic',
                'image': 'aspect/basic/resources/01088.png',
                'resources': [
                    RESOURCE_ENERGY,
                    RESOURCE_ENERGY
                ],
                'maximum': {
                    'count': 1,
                    'target': TARGET_DECK
                },
                'classification': 'basic'
            }
        }
    },
    {
        '_id': 'basic-genius',
        'aspect': 'basic',
        'order': 6,
        'card': {
            'type': CARD_TYPE_RESOURCE,
            'params': {
                'name': 'Genio',
                'set': 'basic',
                'image': 'aspect/basic/resources/01089.png',
                'resources': [
                    RESOURCE_MENTAL,
                    RESOURCE_MENTAL
                ],
                'maximum': {
                    'count': 1,
                    'target': TARGET_DECK
                },
                'classification': 'basic'
            }
        }
    },
    {
        '_id': 'basic-strength',
        'aspect': 'basic',
        'order': 7,
        'card': {
            'type': CARD_TYPE_RESOURCE,
            'params': {
                'name': 'Fuerza',
                'set': 'basic',
                'image': 'aspect/basic/resources/01090.png',
                'resources': [
                    RESOURCE_PHYSICAL,
                    RESOURCE_PHYSICAL
                ],
                'maximum': {
                    'count': 1,
                    'target': TARGET_DECK
                },
                'classification': 'basic'
            }
        }
    },
];
