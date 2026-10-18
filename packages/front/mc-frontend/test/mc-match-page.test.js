import assert from 'node:assert/strict';
import {test} from 'node:test';

globalThis.HTMLElement ??= class {};
globalThis.window ??= {
    customElements: {
        define() {},
    },
    mcStaticRemote: {
        getAssetUrl(path) {
            return path;
        },
    },
};
globalThis.CustomEvent ??= class {
    constructor(type, options = {}) {
        this.type = type;
        Object.assign(this, options);
    }
};

const {getEndTurnConfirmationReasons} = await import(
    '../src/utils/end-turn.js'
);
const {McMatchPage} = await import('../src/pages/mc-match-page/mc-match-page.js');

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

test('forwards a dropped event target to the play-card request', async () => {
    const requests = [];
    const page = Object.assign(Object.create(McMatchPage.prototype), {
        apiPlayer: {
            async playCard(...params) {
                requests.push(params);
            },
        },
        player: 'TChalla',
        playCardPending: false,
    });

    await page.handlePlayCardDrop({
        detail: {
            card: {id: 'damage-event'},
            targetCard: {id: 'villain-1'},
        },
    });

    assert.deepEqual(requests, [['TChalla', 'damage-event', 'villain-1']]);
    assert.equal(page.playCardPending, false);
});
