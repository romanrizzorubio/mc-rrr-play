import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

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

const {McMatchPage} = await import('../src/pages/mc-match-page/mc-match-page.js');

describe('match page card drag and drop', () => {
    test('clears drag state immediately while the play request is pending', async () => {
        const requests = [];
        let resolvePlayCard;
        const playRequest = new Promise(resolve => {
            resolvePlayCard = resolve;
        });
        const page = Object.assign(Object.create(McMatchPage.prototype), {
            apiPlayer: {
                playCard(...params) {
                    requests.push(params);
                    return playRequest;
                },
            },
            dragPlayCard: {
                card: {id: 'damage-event'},
                playableInGameZone: true,
            },
            player: 'TChalla',
            match: {
                phase: 'players',
                currentTurnPlayer: 'TChalla',
                actionRequest: null,
            },
            playCardPending: false,
        });

        const request = page.handlePlayCardDrop({
            detail: {
                card: {id: 'damage-event'},
                targetCard: undefined,
            },
        });

        assert.equal(page.dragPlayCard, null);
        assert.equal(page.playCardPending, true);
        assert.deepEqual(requests, [['TChalla', 'damage-event', undefined]]);

        resolvePlayCard();
        await request;

        assert.equal(page.playCardPending, false);
    });

    test('forwards a player-row target id to the play request', async () => {
        const requests = [];
        const card = {
            id: 'shared-upgrade',
            playable: true,
            playableInGameZone: false,
            playablePlayerIds: ['captain-player', 'marvel-player'],
        };
        const page = Object.assign(Object.create(McMatchPage.prototype), {
            apiPlayer: {
                async playCard(...params) {
                    requests.push(params);
                },
            },
            dragPlayCard: null,
            player: 'TChalla',
            match: {
                phase: 'players',
                currentTurnPlayer: 'TChalla',
                actionRequest: null,
            },
            playCardPending: false,
        });
        page.handlePlayCardDragStart({detail: {card}});

        assert.deepEqual(
            page.dragPlayCard.playablePlayerIds,
            card.playablePlayerIds,
        );

        await page.handlePlayCardDrop({
            detail: {
                card,
                targetId: 'marvel-player',
            },
        });

        assert.deepEqual(requests, [[
            'TChalla',
            'shared-upgrade',
            'marvel-player',
        ]]);
        assert.equal(page.dragPlayCard, null);
    });
});
