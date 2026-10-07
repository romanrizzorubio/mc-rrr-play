import assert from 'node:assert/strict';
import {test} from 'node:test';

const {getEndTurnConfirmationReasons} = await import(
    '../src/utils/end-turn.js'
);

function createPlayer({heroExhausted, allies = [], hand = []}) {
    return {
        superhero: {exhausted: heroExhausted},
        gameZone: {cards: allies},
        hand,
    };
}

test('explains each reason that requires end-turn confirmation', () => {
    assert.deepEqual(
        getEndTurnConfirmationReasons(createPlayer({
            heroExhausted: false,
            allies: [
                {isAlly: true, exhausted: false},
                {isAlly: true, exhausted: true},
            ],
            hand: [
                {id: 'playable-card', playable: true},
                {id: 'unplayable-card', playable: false},
            ],
        })),
        [
            'Tu superhéroe está preparado.',
            'Tienes 1 aliado preparado.',
            'Tienes 1 carta jugable en la mano.',
        ]
    );
});

test('does not include unplayable cards as a confirmation reason when another reason is present', () => {
    assert.deepEqual(getEndTurnConfirmationReasons(createPlayer({
        heroExhausted: true,
        allies: [{isAlly: true, exhausted: false}],
        hand: [{id: 'unplayable-card', playable: false}],
    })), [
        'Tienes 1 aliado preparado.',
    ]);
});

test('does not confirm when the hero and allies are exhausted and the hand is empty', () => {
    const player = createPlayer({
        heroExhausted: true,
        allies: [
            {isAlly: true, exhausted: true},
            {isAlly: false, exhausted: false},
        ],
    });

    assert.deepEqual(getEndTurnConfirmationReasons(player), []);
});

test('ignores unplayable cards when the hero and allies are exhausted', () => {
    const player = createPlayer({
        heroExhausted: true,
        allies: [{isAlly: true, exhausted: true}],
        hand: [
            {id: 'unplayable-event', playable: false},
            {id: 'resource-card', playable: false},
        ],
    });

    assert.deepEqual(getEndTurnConfirmationReasons(player), []);
});
