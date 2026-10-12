import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_ALL_CARDS} from 'mc-shared';
import {FaceDown} from '../../src/model/match/facedown.js';
import {ValidTarget} from '../../src/targets/valid-target.js';

const createFaceDownCards = count => Array.from({length: count}, (_, index) =>
    new FaceDown({
        attached: {},
        card: {
            id: `hidden-card-${index}`,
            isEncounterCard: false,
            isPlayerCard: true,
            owner: {name: 'Player'},
        },
    }));

test('up-to selection resolves distinct facedown cards and enforces its maximum', async () => {
    const faceDownCards = createFaceDownCards(4);
    const serialized = faceDownCards.map(card => card.toObj());
    const selectedIds = [serialized[0].id, serialized[2].id, serialized[3].id];
    let selectionDialog;
    const validTarget = new ValidTarget({
        match: {
            async openDialog(dialog) {
                selectionDialog = dialog;
                return {
                    selected: selectedIds.map(id => ({id})),
                };
            },
        },
    });

    const selected = await validTarget.selectTarget({
        cards: faceDownCards,
        player: {},
        selectCount: 3,
        selectUpTo: true,
        target: TARGET_ALL_CARDS,
    });

    assert.equal(new Set(serialized.map(card => card.id)).size, 4);
    assert.equal(serialized.some(card => card.id.startsWith('hidden-card-')), false);
    assert.equal(serialized.some(card =>
        Object.hasOwn(card, 'name') || Object.hasOwn(card, 'image')), false);
    assert.deepEqual(selected, [
        faceDownCards[0],
        faceDownCards[2],
        faceDownCards[3],
    ]);
    assert.equal(selectionDialog.data.count, 3);
    assert.equal(selectionDialog.data.minCount, 0);
});

test('up-to selection rejects more results than its configured maximum', async () => {
    const faceDownCards = createFaceDownCards(4);
    const validTarget = new ValidTarget({
        match: {
            async openDialog({data}) {
                return {selected: data.cards};
            },
        },
    });

    await assert.rejects(
        validTarget.selectTarget({
            cards: faceDownCards,
            player: {},
            selectCount: 3,
            selectUpTo: true,
            target: TARGET_ALL_CARDS,
        }),
        /La selección múltiple de objetivos no es válida/
    );
});
