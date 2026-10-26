import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

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

describe('McAssignDialog', () => {
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

    test('starts the threat assignment on the first plan and fills remaining capacity', () => {
        const dialog = createDialog({
            autoAssignRemainderToSingleTarget: true,
            assignInitially: true,
            count: 3,
            field: 'threat',
            cards: [
                {id: 'main-scheme', isMainScheme: true, threat: 1},
                {id: 'side-scheme', isSideScheme: true, threat: 4},
            ],
        });

        assert.deepEqual(dialog._response.assigned, {
            'main-scheme': 1,
            'side-scheme': 2,
        });
        assert.equal(dialog.maximum, 3);
        assert.equal(dialog.assigned, 3);
        assert.equal(dialog.validate(), true);

        const rendered = dialog.renderCard(dialog.data.cards[0]);
        const threatBindingIndex = rendered.strings.findIndex(string =>
            string.includes('.threat='));
        assert.notEqual(threatBindingIndex, -1);
        assert.equal(rendered.values[threatBindingIndex], 1);
    });

    test('starts the threat assignment on the plan targeted by the dragged card', () => {
        const dialog = createDialog({
            assignInitially: true,
            count: 3,
            field: 'threat',
            initialTargetId: 'side-scheme',
            cards: [
                {id: 'main-scheme', isMainScheme: true, threat: 4},
                {id: 'side-scheme', isSideScheme: true, threat: 5},
                {id: 'other-side-scheme', isSideScheme: true, threat: 4},
            ],
        });

        assert.deepEqual(dialog._response.assigned, {
            'main-scheme': 0,
            'side-scheme': 3,
            'other-side-scheme': 0,
        });
        assert.equal(dialog.validate(), true);
    });

    test('fills later plans when the dragged plan cannot absorb the full assignment', () => {
        const dialog = createDialog({
            assignInitially: true,
            count: 3,
            field: 'threat',
            initialTargetId: 'side-scheme',
            cards: [
                {id: 'main-scheme', isMainScheme: true, threat: 4},
                {id: 'side-scheme', isSideScheme: true, threat: 1},
                {id: 'other-side-scheme', isSideScheme: true, threat: 4},
            ],
        });

        assert.deepEqual(dialog._response.assigned, {
            'main-scheme': 2,
            'side-scheme': 1,
            'other-side-scheme': 0,
        });
        assert.equal(dialog.validate(), true);
    });

    test('takes increased assignment from the plan with the highest allocation', () => {
        const dialog = createDialog({
            autoAssignRemainderToSingleTarget: true,
            assignInitially: true,
            count: 3,
            field: 'threat',
            cards: [
                {id: 'first-scheme', isMainScheme: true, threat: 3},
                {id: 'second-scheme', isSideScheme: true, threat: 3},
                {id: 'third-scheme', isSideScheme: true, threat: 3},
            ],
        });

        assert.deepEqual(dialog._response.assigned, {
            'first-scheme': 3,
            'second-scheme': 0,
            'third-scheme': 0,
        });

        dialog.handleSlider(dialog.data.cards[1])({
            stopPropagation() {},
            target: {value: '2'},
        });

        assert.deepEqual(dialog._response.assigned, {
            'first-scheme': 1,
            'second-scheme': 2,
            'third-scheme': 0,
        });
        assert.equal(dialog.validate(), true);
    });

    test('does not reassign a decrease to another plan', () => {
        const dialog = createDialog({
            autoAssignRemainderToSingleTarget: true,
            assignInitially: true,
            count: 3,
            field: 'threat',
            preserveRemainderOnDecrease: true,
            cards: [
                {id: 'first-scheme', isMainScheme: true, threat: 3},
                {id: 'second-scheme', isSideScheme: true, threat: 3},
            ],
        });

        dialog.handleSlider(dialog.data.cards[0])({
            stopPropagation() {},
            target: {value: '1'},
        });

        assert.deepEqual(dialog._response.assigned, {
            'first-scheme': 1,
            'second-scheme': 0,
        });
        assert.equal(dialog.assigned, 1);
        assert.equal(dialog.validate(), false);
    });

});
