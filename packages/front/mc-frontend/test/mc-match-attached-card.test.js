import assert from 'node:assert/strict';
import {test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};

const {MatchComponent} = await import(
    '../src/components/views/mc-match/mc-match.js'
);

test('routes attached player card actions to the match ability handler', () => {
    const match = Object.assign(Object.create(MatchComponent.prototype), {
        match: {
            currentTurnPlayer: 'Player 1',
            phase: 'players',
        },
        player: {
            name: 'Player 1',
        },
        playCardPending: false,
    });
    const template = match.renderPlayer();
    const listenerIndex = template.strings.findIndex(part =>
        part.includes('@attached-card-click=')
    );

    assert.notEqual(listenerIndex, -1);
    assert.equal(typeof template.values[listenerIndex], 'function');
});
