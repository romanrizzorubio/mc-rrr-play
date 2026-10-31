import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};

const {McListDialog} = await import(
    '../src/components/dialog/mc-list-dialog/mc-list-dialog.js'
);

describe('McListDialog option groups', () => {
    for (const text of [undefined, '']) {
        test(`omits an empty group heading (${String(text)}) without losing choices`, () => {
            const dialog = Object.create(McListDialog.prototype);
            const choices = [
                {id: '0.0', text: 'Coloca 1 de amenaza'},
                {id: '0.1', text: '+2 ATQ'},
            ];
            const content = dialog.renderItem({text, triggers: choices});

            assert.equal(content.values[0], '');
            const items = content.values[1];
            assert.equal(items.length, 2);
            assert.ok(items.every(item =>
                item.strings.join('').includes('interactive')));
            assert.ok(items.every(item => item.values.includes('')));
            assert.ok(items.every(item => !item.values.includes('submenu')));
        });
    }

    test('preserves a named heading and indents its selectable choices', () => {
        const dialog = Object.create(McListDialog.prototype);
        const content = dialog.renderItem({
            text: 'Resolver la obligación',
            triggers: [{id: '0.0', text: 'Agotar al héroe'}],
        });

        assert.match(content.values[0].strings.join(''), /title-menu/);
        assert.ok(content.values[1][0].values.includes('submenu'));
    });

    test('keeps each choice selectable by its original ID', () => {
        let responses = 0;
        const dialog = Object.assign(Object.create(McListDialog.prototype), {
            _response: {},
            sendResponse() {
                responses++;
            },
        });
        const choice = {id: '0.1', text: '+2 ATQ'};
        dialog.handleClick(choice)({stopPropagation() {}});

        assert.equal(dialog._response.selected, choice);
        assert.equal(responses, 1);
    });
});
