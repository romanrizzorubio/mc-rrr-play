import {
    CLASSIFICATION_BASIC,
    CARD_TYPE_RESOURCE,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_DECK,
} from 'mc-shared';

export default [
    {
        '_id': 'basic-energy',
        'classification': 'basic',
        'order': 5,
        'card': {
            'type': CARD_TYPE_RESOURCE,
            'params': {
                'name': 'Energía',
                'set': CLASSIFICATION_BASIC,
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
        'classification': 'basic',
        'order': 6,
        'card': {
            'type': CARD_TYPE_RESOURCE,
            'params': {
                'name': 'Genio',
                'set': CLASSIFICATION_BASIC,
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
        'classification': 'basic',
        'order': 7,
        'card': {
            'type': CARD_TYPE_RESOURCE,
            'params': {
                'name': 'Fuerza',
                'set': CLASSIFICATION_BASIC,
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
    {
        '_id': 'basic-el-poder-de-todos-unidos',
        'classification': 'basic',
        'order': 13024,
        'card': {
            'type': CARD_TYPE_RESOURCE,
            'params': {
                'name': 'El poder de todos unidos',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/resources/13024.png',
                'resources': [
                    {
                        'condition': {
                            'card.classification': CLASSIFICATION_BASIC
                        },
                        'costOnly': true,
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
                'classification': CLASSIFICATION_BASIC
            }
        }
    },
];
