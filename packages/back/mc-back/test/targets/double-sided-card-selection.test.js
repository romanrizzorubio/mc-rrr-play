import assert from 'node:assert/strict';
import test from 'node:test';

import {TARGET_ENEMY} from 'mc-shared';
import {ValidTarget} from '../../src/targets/valid-target.js';

const createSelection = ({multipleTarget = false, selection}) => {
    const villain = {
        id: '--norman-osborn--green-goblin',
        abilities: [],
        toObj() {
            return {
                id: 'norman-osborn--risky-business',
                parentId: this.id,
                name: 'Norman Osborn',
            };
        },
    };
    const minion = {
        id: 'security-guard',
        abilities: [],
        toObj() {
            return {
                id: this.id,
                name: 'Guardia privado de seguridad',
            };
        },
    };
    const match = {
        enemies: [minion, villain],
        async openDialog({data}) {
            const selected = data.cards.find(card =>
                card.name === 'Norman Osborn');

            return {selected: selection === 'multiple' ? [selected] : selected};
        },
    };

    return {
        match,
        minion,
        validTarget: new ValidTarget({match, multipleTarget}),
        villain,
    };
};

test('single-target selection maps a double-sided card back to its game card', async () => {
    const {match, validTarget, villain} = createSelection({});

    const selected = await validTarget.selectTarget({
        player: {},
        target: TARGET_ENEMY,
    });

    assert.equal(match.enemies[1].toObj().parentId, villain.id);
    assert.strictEqual(selected, villain);
});

test('multi-target selection maps a selected side to its double-sided game card', async () => {
    const {validTarget, villain} = createSelection({
        multipleTarget: true,
        selection: 'multiple',
    });

    const selected = await validTarget.selectTarget({
        player: {},
        selectCount: 1,
        target: TARGET_ENEMY,
    });

    assert.deepEqual(selected, [villain]);
});

test('single-target selection rejects an id that is not a valid candidate', async () => {
    const {match, validTarget} = createSelection({});
    match.openDialog = async () => ({
        selected: {id: 'unknown-card'},
    });

    await assert.rejects(
        validTarget.selectTarget({
            player: {},
            target: TARGET_ENEMY,
        }),
        /La selección del objetivo no es válida/
    );
});
