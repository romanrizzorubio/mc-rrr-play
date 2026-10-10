import assert from 'node:assert/strict';
import {test} from 'node:test';

import {DIALOG_ACTIVATE} from 'mc-shared';
import {Attack} from '../../src/activations/attack.js';
import {Scheme} from '../../src/activations/scheme.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {EnemySchemeEffect} from '../../src/effects/enemy-scheme-effect.js';

function createCharacter() {
    return {
        confused: 0,
        isConfused: false,
        isStunned: false,
        name: 'Klaw',
        removeConfused() {
            this.confused = 0;
            this.isConfused = false;
        },
        removeStunned() {
            this.stunned = 0;
            this.isStunned = false;
        },
        refresh() {},
        stunned: 0,
    };
}

test('stunned enemy attack shows why it was skipped before consuming stun', async () => {
    const character = createCharacter();
    character.stunned = 1;
    character.isStunned = true;

    const effect = new EnemyAttackEffect({
        enemy: character,
        match: {},
    });
    effect.activation = new Attack({effect});
    effect.trigger = async () => true;

    const openedDialogs = [];
    let resolveDialog;
    let notifyDialogOpened;
    const dialogOpened = new Promise(resolve => {
        notifyDialogOpened = resolve;
    });
    const dialogResponse = new Promise(resolve => {
        resolveDialog = resolve;
    });
    effect.openDialog = async dialog => {
        openedDialogs.push(dialog);
        notifyDialogOpened();

        return dialogResponse;
    };

    const activation = effect.triggerWould({});
    await dialogOpened;

    assert.equal(openedDialogs[0].dialogType, DIALOG_ACTIVATE);
    assert.equal(openedDialogs[0].title, 'Activación omitida');
    assert.equal(openedDialogs[0].data.statusType, 'stunned');
    assert.equal(openedDialogs[0].data.statusMessage, 'Klaw estaba aturdido y no ataca.');
    assert.equal(character.isStunned, true);

    resolveDialog();
    assert.equal(await activation, false);
    assert.equal(character.isStunned, false);
});

test('confused enemy scheme shows why it was skipped before consuming confusion', async () => {
    const character = createCharacter();
    character.confused = 1;
    character.isConfused = true;

    const effect = new EnemySchemeEffect({
        enemy: character,
        match: {},
    });
    effect.activation = new Scheme({effect});
    effect.trigger = async () => true;

    const openedDialogs = [];
    let resolveDialog;
    let notifyDialogOpened;
    const dialogOpened = new Promise(resolve => {
        notifyDialogOpened = resolve;
    });
    const dialogResponse = new Promise(resolve => {
        resolveDialog = resolve;
    });
    effect.openDialog = async dialog => {
        openedDialogs.push(dialog);
        notifyDialogOpened();

        return dialogResponse;
    };

    const activation = effect.triggerWould({});
    await dialogOpened;

    assert.equal(openedDialogs[0].dialogType, DIALOG_ACTIVATE);
    assert.equal(openedDialogs[0].title, 'Activación omitida');
    assert.equal(openedDialogs[0].data.statusType, 'confused');
    assert.equal(openedDialogs[0].data.statusMessage, 'Klaw estaba confundido y no ejecuta el plan.');
    assert.equal(character.isConfused, true);

    resolveDialog();
    assert.equal(await activation, false);
    assert.equal(character.isConfused, false);
});
