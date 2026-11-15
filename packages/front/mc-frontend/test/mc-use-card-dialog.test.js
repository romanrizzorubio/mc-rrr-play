import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import styles from '../src/components/dialog/mc-use-card-dialog/mc-use-card-dialog.css.js';

globalThis.HTMLElement ??= class {};
globalThis.window ??= {};
globalThis.window.customElements ??= {define() {}};
globalThis.window.mcStaticRemote ??= {
    getAssetUrl: path => path,
};

const {McUseCardDialog} = await import(
    '../src/components/dialog/mc-use-card-dialog/mc-use-card-dialog.js'
);

describe('use card dialog', () => {
    test('aligns interrupt and response cards to the bottom', () => {
        assert.match(
            styles.cssText,
            /mc-card-list\s*{[^}]*align-items:\s*flex-end/s
        );
    });

    test('explains card selection and labels the optional button', () => {
        const dialog = Object.assign(
            Object.create(McUseCardDialog.prototype),
            {
                data: {},
                hideOk: false,
                showCancel: true,
            },
        );
        const button = dialog.renderButtonOk();

        assert.equal(
            dialog.getFooter(),
            'Pincha en la carta que quieras activar. Pulsa «No usar ninguna» si no quieres activar ninguna.',
        );
        assert.match(button.strings.join(''), />No usar ninguna<\/md-text-button>/u);
    });

    test('keeps the selection instruction when the choice is mandatory', () => {
        const dialog = Object.assign(
            Object.create(McUseCardDialog.prototype),
            {
                data: {},
                hideOk: true,
                showCancel: false,
            },
        );

        assert.equal(
            dialog.getFooter(),
            'Pincha en la carta que quieras activar.',
        );
        assert.equal(dialog.renderButtonOk().strings.join(''), '');
    });
});
