import {
    CARD_TYPE_RESOURCE,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
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
                'image': 'aspect/basic/resources/b88-copy-2.webp',
                'resources': [
                    RESOURCE_ENERGY,
                    RESOURCE_ENERGY
                ],
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
                'image': 'aspect/basic/resources/b89-copy-2.webp',
                'resources': [
                    RESOURCE_MENTAL,
                    RESOURCE_MENTAL
                ],
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
                'image': 'aspect/basic/resources/b90-copy-2.webp',
                'resources': [
                    RESOURCE_PHYSICAL,
                    RESOURCE_PHYSICAL
                ],
                'classification': 'basic'
            }
        }
    },
];
