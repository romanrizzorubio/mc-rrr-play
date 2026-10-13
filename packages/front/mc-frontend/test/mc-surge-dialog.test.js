import assert from 'node:assert/strict';
import {test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};

const {McSurgeDialog} = await import(
    '../src/components/dialog/mc-surge-dialog/mc-surge-dialog.js'
);

const renderTemplate = value => {
    if (Array.isArray(value)) {
        return value.map(renderTemplate).join('');
    }
    if (value && Array.isArray(value.strings) && Array.isArray(value.values)) {
        return value.strings.map((part, index) =>
            `${part}${renderTemplate(value.values[index])}`
        ).join('');
    }
    if (value === null || value === undefined || typeof value === 'boolean') {
        return '';
    }

    return String(value);
};

test('surge dialog shows an encounter card back and an option to hide later notices', () => {
    const dialog = Object.create(McSurgeDialog.prototype);
    dialog.data = {allowHideFuture: true};
    dialog._skipSurgeNotification = false;
    const markup = renderTemplate(dialog.renderContent());

    assert.match(markup, /name="Carta de Encuentros"/);
    assert.match(markup, /image="back\/encounter\.jpg"/);
    assert.match(markup, /type="checkbox"/);
    assert.match(markup, /No volver a mostrar este aviso durante esta partida/);
});

test('surge dialog returns the hide preference when the checkbox is selected', () => {
    const dialog = Object.create(McSurgeDialog.prototype);
    dialog.data = {allowHideFuture: true};
    dialog._response = {};
    let response;
    dialog.dispatchEvent = event => {
        response = event.detail;
    };

    dialog.handleSkipSurgeNotificationChange({target: {checked: true}});
    dialog.sendResponse();

    assert.deepEqual(response, {skipSurgeNotification: true});
});
