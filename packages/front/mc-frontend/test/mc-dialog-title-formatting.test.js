import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};

const {McSelectCardDialog} = await import(
    '../src/components/dialog/mc-select-card-dialog/mc-select-card-dialog.js'
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

describe('formatted dialog titles', () => {
    test('renders resource icons in card selection titles', () => {
        const dialog = Object.assign(
            Object.create(McSelectCardDialog.prototype),
            {
                data: {
                    title: 'Elige hasta 2 cartas con un recurso [m] impreso',
                },
                title: '',
            },
        );
        const markup = renderTemplate(dialog.renderTitle());

        assert.ok(markup.includes(
            'Elige hasta 2 cartas con un recurso ' +
                '<mc-icon icon="m"></mc-icon> impreso'
        ));
    });
});
