import assert from 'node:assert/strict';
import {test} from 'node:test';

import {DIALOG_SELECT_TARGET} from 'mc-shared';
import {SeveralActivationsEffect} from '../../src/effects/several-activations-effect.js';
import {SeveralAttacksEffect} from '../../src/effects/several-attacks-effect.js';

const createEnemy = id => ({
    abilities: [],
    id,
    isInPlay: true,
    isMinion: true,
    name: id,
    toObj() {
        return {id: this.id, name: this.name};
    },
});

for (const [name, EffectClass] of [
    ['several activations', SeveralActivationsEffect],
    ['group attacks', SeveralAttacksEffect],
]) {
    test(`${name} let the player choose each enemy activation`, async () => {
        const enemies = ['minion-1', 'minion-2', 'minion-3'].map(createEnemy);
        const choices = ['minion-3', 'minion-1'];
        const dialogs = [];
        const activations = [];
        const match = {
            async openDialog(dialog) {
                dialogs.push(dialog);

                return {selected: {id: choices.shift()}};
            },
        };
        const effect = new EffectClass({enemies, match});
        effect.activate = async enemy => {
            activations.push(enemy.id);
        };

        await effect.execute({player: {}});

        assert.deepEqual(activations, ['minion-3', 'minion-1', 'minion-2']);
        assert.equal(dialogs.length, 2);
        assert.ok(dialogs.every(({dialogType}) => dialogType === DIALOG_SELECT_TARGET));
        assert.ok(dialogs.every(({title}) => title === 'Elige qué enemigo se activa'));
        assert.deepEqual(
            dialogs.map(({data}) => data.cards.map(({id}) => id)),
            [
                ['minion-1', 'minion-2', 'minion-3'],
                ['minion-1', 'minion-2'],
            ]
        );
        assert.deepEqual(choices, []);
    });
}

test('a single minion activates without a selection dialog', async () => {
    const enemy = createEnemy('minion');
    let openedDialogs = 0;
    const activations = [];
    const effect = new SeveralActivationsEffect({
        enemies: [enemy],
        match: {
            async openDialog() {
                openedDialogs++;
            },
        },
    });
    effect.activate = async selectedEnemy => {
        activations.push(selectedEnemy);
    };

    await effect.execute({player: {}});

    assert.deepEqual(activations, [enemy]);
    assert.equal(openedDialogs, 0);
});
