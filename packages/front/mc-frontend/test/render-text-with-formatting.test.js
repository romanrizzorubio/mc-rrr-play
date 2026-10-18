import assert from 'node:assert/strict';
import {test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};

const {renderTextWithFormatting} = await import(
    '../src/utils/render-text-with-formatting.js'
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

test('renderTextWithFormatting renders supported resource tokens and preserves unknown tokens', () => {
    const markup = renderTemplate(
        renderTextWithFormatting('Descarta [m] o [p]; conserva [v].')
    );

    assert.equal(
        markup,
        'Descarta <mc-icon icon="m"></mc-icon> o ' +
            '<mc-icon icon="p"></mc-icon>; conserva [v].'
    );
});

test('renderTextWithFormatting preserves strings without supported icon tokens', () => {
    assert.equal(
        renderTemplate(renderTextWithFormatting('Texto normal [v].')),
        'Texto normal [v].'
    );
});

test('the choose-option dialog renders icons in option text', () => {
    const listDialog = {
        handleClick: () => () => {},
    };
    const markup = renderTemplate(
        McListDialog.prototype.renderItem.call(listDialog, {
            text: 'Descarta [m] y [p].',
        })
    );

    assert.ok(markup.includes(
        'Descarta <mc-icon icon="m"></mc-icon> y ' +
            '<mc-icon icon="p"></mc-icon>.'
    ));
});

test('the choose-option dialog renders marked traits in the trait font', () => {
    const listDialog = {
        handleClick: () => () => {},
    };
    const markup = renderTemplate(
        McListDialog.prototype.renderItem.call(listDialog, {
            text: 'Descarta una carta de <PLANIFICACIÓN> con el coste más alto que controles',
        })
    );

    assert.ok(markup.includes(
        'Descarta una carta de ' +
            '<span class="trait-reference">PLANIFICACIÓN</span> ' +
            'con el coste más alto que controles'
    ));
    assert.ok(!markup.includes('<PLANIFICACIÓN>'));
});

test('the choose-option dialog leaves unmarked trait words unchanged', () => {
    const listDialog = {
        handleClick: () => () => {},
    };
    const markup = renderTemplate(
        McListDialog.prototype.renderItem.call(listDialog, {
            text: 'Texto PLANIFICACIÓN sin marcar.',
        })
    );

    assert.ok(markup.includes('Texto PLANIFICACIÓN sin marcar.'));
    assert.ok(!markup.includes('trait-reference'));
});
