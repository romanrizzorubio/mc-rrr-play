import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    DIALOG_LIST,
    DIALOG_SELECT_TARGET,
} from 'mc-shared';
import {ReplaceStatusEffect} from '../../src/effects/replace-status-effect.js';

const createCharacter = (id, statusCards) => ({
    id,
    abilities: [],
    ...statusCards,
    toObj() {
        return {id: this.id};
    },
    async refresh() {},
    removeStunned(count = 0) {
        this.stunned = Math.max(0, this.stunned - (count || this.stunned));
    },
    removeConfused(count = 0) {
        this.confused = Math.max(0, this.confused - (count || this.confused));
    },
    removeTough(count = 0) {
        this.tough = Math.max(0, this.tough - (count || this.tough));
    },
    stun() {
        this.stunned++;
    },
    confuse() {
        this.confused++;
    },
    setTough() {
        this.tough++;
    },
});

test('ReplaceStatusEffect opens character, source-status, and replacement dialogs', async () => {
    const character = createCharacter('hero', {
        stunned: 1,
        confused: 1,
        tough: 0,
    });
    const otherCharacter = createCharacter('ally', {
        stunned: 0,
        confused: 0,
        tough: 1,
    });
    const match = {
        characters: [character, otherCharacter],
        triggerCards: {},
    };
    const dialogs = [];
    const effect = new ReplaceStatusEffect({
        match,
    });
    effect.openDialog = async dialog => {
        dialogs.push(dialog);
        if (dialog.dialogType === DIALOG_LIST) {
            assert.ok(dialog.data.options.every(option =>
                typeof option.image === 'string' &&
                option.image.startsWith('status/')));
        }
        if (dialog.dialogType === DIALOG_SELECT_TARGET) {
            return {selected: {id: character.id}};
        }
        if (dialogs.length === 2) {
            return {selected: {id: 'stunned'}};
        }

        return {selected: {id: 'tough'}};
    };

    await effect.runEffect({
        match,
        player: {},
    });

    assert.deepEqual(
        dialogs.map(dialog => dialog.dialogType),
        [DIALOG_SELECT_TARGET, DIALOG_LIST, DIALOG_LIST],
    );
    assert.equal(character.stunned, 0);
    assert.equal(character.confused, 1);
    assert.equal(character.tough, 1);
});
