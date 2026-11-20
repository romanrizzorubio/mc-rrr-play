import assert from 'node:assert/strict';
import {describe, test} from 'node:test';
import {RESOURCE_MENTAL} from 'mc-shared';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};

const {McSelectCardDialog} = await import(
    '../src/components/dialog/mc-select-card-dialog/mc-select-card-dialog.js'
);
const {McListDialog} = await import(
    '../src/components/dialog/mc-list-dialog/mc-list-dialog.js'
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

    test('renders resource icons in explanatory subtitles', () => {
        const dialog = Object.assign(
            Object.create(McListDialog.prototype),
            {
                subtitle: 'No tienes suficientes recursos de tipo ' +
                    `[${RESOURCE_MENTAL}] para pagar este coste.`,
            },
        );
        const markup = renderTemplate(dialog.renderSubtitle());

        assert.ok(markup.includes(
            'No tienes suficientes recursos de tipo ' +
                `<mc-icon icon="${RESOURCE_MENTAL}"></mc-icon> ` +
                'para pagar este coste.'
        ));
    });
});
