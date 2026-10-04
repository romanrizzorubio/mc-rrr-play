import {
    CARD_TYPE_RESOURCE,
    RESOURCE_WILD
} from 'mc-shared';

export default [
    {
        '_id': 'leadership-el-poder-del-liderazgo',
        'aspect': 'leadership',
        'order': 5,
        'card': {
            'type': CARD_TYPE_RESOURCE,
            'params': {
                'name': 'El poder del liderazgo',
                'set': 'leadership',
                'image': 'aspect/leadership/resources/01072.png',
                'resources': [
                    {
                        'condition': {
                            'card.set': 'leadership'
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
                    'count': 2
                },
                'classification': 'leadership'
            }
        }
    }
];
