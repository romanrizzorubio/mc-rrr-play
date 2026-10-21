import {
    CARD_TYPE_RESOURCE,
    RESOURCE_WILD,
    TARGET_DECK
} from 'mc-shared';

export default [
    {
        '_id': 'aggression-the-power-of-aggression',
        'aspect': 'aggression',
        'order': 5,
        'card': {
            'type': CARD_TYPE_RESOURCE,
            'params': {
                'name': 'El poder de la agresividad',
                'set': 'aggression',
                'image': 'aspect/aggression/resources/01055.png',
                'resources': [
                    {
                        'condition': {
                            'card.set': 'aggression'
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
                'classification': 'aggression'
            }
        }
    }
];
