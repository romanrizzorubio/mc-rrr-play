import assert from 'node:assert/strict';
import {test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    mcStaticRemote: {
        getAssetUrl(path) {
            return path;
        },
    },
    customElements: {
        define() {},
    },
};

const {McAssignDialog} = await import(
    '../src/components/dialog/mc-assign-dialog/mc-assign-dialog.js'
);

function createDialog(data) {
    const dialog = Object.create(McAssignDialog.prototype);
    dialog.data = data;
    dialog._response = {};
    dialog.initProperties();

    return dialog;
}

test('assigns indirect damage to the superhero first, then allies by capacity', () => {
    const dialog = createDialog({
        count: 6,
        field: 'life',
        cards: [
            {id: 'hero', isSuperhero: true, life: 2},
            {id: 'first-ally', life: 3},
            {id: 'second-ally', life: 4},
        ],
    });

    assert.deepEqual(dialog._response.assigned, {
        hero: 2,
        'first-ally': 3,
        'second-ally': 1,
    });
    assert.equal(dialog.assigned, 6);
    assert.equal(dialog.validate(), true);
});

test('moving an ally slider transfers that damage from the superhero', () => {
    const dialog = createDialog({
        count: 6,
        field: 'life',
        cards: [
            {id: 'hero', isSuperhero: true, life: 2},
            {id: 'ally', life: 5},
            {id: 'other-ally', life: 4},
        ],
    });

    dialog.handleSlider(dialog.data.cards[1])({
        stopPropagation() {},
        target: {value: '5'},
    });

    assert.deepEqual(dialog._response.assigned, {
        hero: 1,
        ally: 5,
        'other-ally': 0,
    });
    assert.equal(dialog.assigned, 6);
    assert.equal(dialog.validate(), true);
});

test('redistributes damage from other characters when the superhero has none assigned', () => {
    const dialog = createDialog({
        count: 4,
        field: 'life',
        cards: [
            {id: 'hero', isSuperhero: true, life: 0},
            {id: 'first-ally', life: 4},
            {id: 'second-ally', life: 4},
        ],
    });

    dialog.handleSlider(dialog.data.cards[2])({
        stopPropagation() {},
        target: {value: '2'},
    });

    assert.deepEqual(dialog._response.assigned, {
        hero: 0,
        'first-ally': 2,
        'second-ally': 2,
    });
    assert.equal(dialog.assigned, 4);
    assert.equal(dialog.validate(), true);
});

test('caps each slider at the total damage or the character assignable capacity', () => {
    const dialog = createDialog({
        count: 5,
        field: 'life',
        cards: [
            {id: 'hero', isSuperhero: true, life: 2},
            {id: 'ally', life: 8},
        ],
    });

    assert.equal(dialog.renderAssigned(dialog.data.cards[0]).values[0], 2);
    assert.equal(dialog.renderAssigned(dialog.data.cards[1]).values[0], 5);
});
