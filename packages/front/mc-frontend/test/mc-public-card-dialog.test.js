import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {customElements: {define() {}}};
const {McEncountersRevealDialog} = await import(
    '../src/components/dialog/mc-encounters-reveal-dialog/mc-encounters-reveal-dialog.js'
);
const {McBoostDealtDialog} = await import(
    '../src/components/dialog/mc-boost-dealt-dialog/mc-boost-dealt-dialog.js'
);

describe('public card dialogs', () => {
    const renderTemplate = value => {
        if (Array.isArray(value)) {
            return value.map(renderTemplate).join('');
        }
        if (value?.strings && value?.values) {
            return value.strings.map((part, index) =>
                part + renderTemplate(value.values[index])).join('');
        }
        return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
    };
    const getBindings = (template, name) => {
        if (Array.isArray(template)) {
            return template.flatMap(value => getBindings(value, name));
        }
        if (!template?.strings) {
            return [];
        }
        return template.values.flatMap((value, index) => [
            ...(template.strings[index].endsWith(`.${name}="`) ? [value] : []),
            ...getBindings(value, name),
        ]);
    };
    const createDialog = (Component, readOnly) => Object.assign(
        Object.create(Component.prototype), {
            title: 'Mostrando carta',
            subtitle: 'Etapa completada',
            footer: 'Información pública',
            targetPlayerName: 'Capitana Marvel',
            readOnly,
            showCancel: true,
            hideOk: false,
            _response: {},
            data: {
                card: {
                    name: 'Encuentro',
                    image: 'encounter.png',
                    isFacedownCard: true,
                    canPeekFacedown: true,
                },
                cards: [{
                    card: {
                        name: 'Aumento',
                        image: 'boost.png',
                        isFacedownCard: true,
                        canPeekFacedown: true,
                    },
                }],
                cardCount: 1,
                allowHideFuture: true,
            },
        });

    test('identifies the responsible player without replacing the existing subtitle', () => {
        for (const Component of [McEncountersRevealDialog, McBoostDealtDialog]) {
            const dialog = createDialog(Component, true);
            const shownType = Component === McBoostDealtDialog ?
                'Aumento mostrado' : 'Carta mostrada';
            assert.equal(dialog.getSubtitle(),
                `Etapa completada ${shownType} por Capitana Marvel.`);
            dialog.subtitle = '';
            assert.equal(dialog.getSubtitle(), `${shownType} por Capitana Marvel.`);
            dialog.targetPlayerName = '';
            assert.equal(dialog.getSubtitle(), '');
        }
    });

    test('labels a minion entering play by the hero it is engaged with', () => {
        const dialog = createDialog(McEncountersRevealDialog, false);
        dialog.subtitle = '';
        dialog.title = 'Esbirro enfrentado a';

        assert.equal(dialog.getTitle(), 'Esbirro enfrentado a Capitana Marvel');
        assert.equal(dialog.getSubtitle(), '');
        const markup = renderTemplate(dialog.render());
        assert.match(markup, /Esbirro enfrentado a Capitana Marvel/u);
        assert.doesNotMatch(markup, /Carta mostrada/u);
    });

    test('every boost display identifies its hero once as Aumento mostrado por', () => {
        for (const Component of [McEncountersRevealDialog, McBoostDealtDialog]) {
            for (const readOnly of [false, true]) {
                const dialog = createDialog(Component, readOnly);
                dialog.data.isBoost = true;
                const markup = renderTemplate(dialog.render());
                assert.equal(markup.match(/Aumento mostrado por Capitana Marvel\./gu)?.length, 1);
                assert.doesNotMatch(markup, /Héroe responsable|Carta mostrada por/u);
                assert.match(markup, /Etapa completada/u);
            }
        }
    });

    test('observers have no buttons, no peek controls and no preference checkbox', () => {
        for (const Component of [McEncountersRevealDialog, McBoostDealtDialog]) {
            const dialog = createDialog(Component, true);
            const markup = renderTemplate(dialog.render());
            assert.doesNotMatch(markup, />Ok<\/md-text-button>|>Cancelar<\/md-text-button>|<input|Ver mano/u);
            assert.match(markup, /Ver mesa/u);
            assert.deepEqual(getBindings(dialog.renderContent(), 'canPeekFacedown'), [false]);
            assert.match(markup, /Capitana Marvel[\s\S]*<div inert>/u);
            assert.match(markup, /<\/div>[\s\S]*Información pública/u);
        }
    });

    test('only the responsible player retains the normal controls', () => {
        for (const Component of [McEncountersRevealDialog, McBoostDealtDialog]) {
            const dialog = createDialog(Component, false);
            const markup = renderTemplate(dialog.render());
            assert.match(markup, />Ok<\/md-text-button>/u);
            assert.match(markup, />Cancelar<\/md-text-button>/u);
            assert.match(markup, /Ver mesa/u);
            assert.doesNotMatch(markup, /<div inert>/u);
            assert.deepEqual(getBindings(dialog.renderContent(), 'canPeekFacedown'), [true]);
            if (Component === McBoostDealtDialog) {
                assert.match(markup, /<input/u);
            }
        }
    });

    test('read-only handlers block responses but allow opening the table view', () => {
        for (const Component of [McEncountersRevealDialog, McBoostDealtDialog]) {
            const dialog = createDialog(Component, true);
            const events = [];
            dialog.dispatchEvent = event => events.push(event);
            dialog.sendResponse();
            dialog.handleOk();
            dialog.handleCancel();
            dialog.handleViewTable();
            assert.deepEqual(events.map(event => event.type), ['dialog-view-table']);
        }
    });
});
