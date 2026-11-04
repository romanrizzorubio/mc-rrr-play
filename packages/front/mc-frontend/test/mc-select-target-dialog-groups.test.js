import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};

const {McSelectTargetDialog} = await import(
    '../src/components/dialog/mc-select-target-dialog/mc-select-target-dialog.js'
);
const targetDialogStyles = (await import(
    '../src/components/dialog/mc-select-target-dialog/mc-select-target-dialog.css.js'
)).default;

describe('McSelectTargetDialog target groups', () => {
    const createDialog = () => {
        const dialog = Object.create(McSelectTargetDialog.prototype);
        dialog.data = {};
        dialog._response = {};
        dialog.initProperties();

        return dialog;
    };

    test('renders each target group with its title and cards', () => {
        const villain = {id: 'villain'};
        const minion = {id: 'minion'};
        const dialog = createDialog();
        dialog.data = {
            ...dialog.data,
            cards: [villain, minion],
            groups: [
                {title: 'Villano', cards: [villain]},
                {
                    title: 'Esbirros enfrentados a Ana',
                    cards: [minion],
                },
            ],
        };

        const template = dialog.renderContent();
        const groups = template.values[0];

        assert.equal(groups.length, 2);
        assert.deepEqual(
            groups.map(group => group.values[0]),
            ['Villano', 'Esbirros enfrentados a Ana']
        );
        assert.deepEqual(
            groups.map(group => group.values[2]),
            [[villain], [minion]]
        );
        assert.ok(groups.every(group =>
            group.strings.join('').includes('target-group-title')));
    });

    test('lays target groups out horizontally', () => {
        assert.match(targetDialogStyles.cssText, /flex-direction:\s*row/);
        assert.match(targetDialogStyles.cssText, /flex-wrap:\s*nowrap/);
    });

    test('removes selected multi-target cards from both group and flat lists', () => {
        const villain = {id: 'villain'};
        const minion = {id: 'minion'};
        const dialog = createDialog();
        dialog.data = {
            ...dialog.data,
            cards: [villain, minion],
            count: 2,
            groups: [
                {title: 'Villano', cards: [villain]},
                {title: 'Esbirros enfrentados a Ana', cards: [minion]},
            ],
            multiSelect: true,
        };
        dialog.handleCardListSelect({detail: {card: minion}});

        assert.deepEqual(dialog.data.cards, [villain]);
        assert.deepEqual(dialog.data.groups, [
            {title: 'Villano', cards: [villain]},
        ]);
        assert.deepEqual(dialog._response.selected, [minion]);
    });
});
