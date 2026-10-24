import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};

const {McConfirmDialog} = await import(
    '../src/components/dialog/mc-confirm-dialog/mc-confirm-dialog.js'
);

describe('McConfirmDialog thwart-value choice', () => {
    test('shows the plan and actor cards with their values and confirm buttons', () => {
        const character = {
            attack: 4,
            image: 'heroes/spiderman/peter1.webp',
            name: 'Spider-Man',
            thwart: 2,
        };
        const scheme = {
            id: 'red-house',
            image: 'scenarios/red-skull/04139.png',
            isSideScheme: true,
            name: 'La Casa Roja',
            threat: 3,
        };
        const dialog = Object.assign(Object.create(McConfirmDialog.prototype), {
            data: {
                thwartValueChoice: {
                    character,
                    scheme,
                    intValue: 2,
                    attackValue: 4,
                },
                okText: 'OK',
                cancelText: 'Cancelar',
            },
            subtitle: 'Intervención básica contra La Casa Roja.',
        });

        const content = dialog.renderContent();
        const previews = content.values.filter(value =>
            value?.strings?.join('').includes('basic-activation-card')
        );

        assert.equal(dialog.getTitle(), '¿Quieres usar ATQ en vez de INT?');
        assert.equal(dialog.getSubtitle(), 'Intervención básica contra La Casa Roja.');
        assert.equal(previews.length, 2);
        assert.doesNotMatch(content.strings.join(''), /Valores de intervención/);
        assert.ok(previews[0].values.includes(character.image));
        assert.ok(previews[1].values.includes(scheme.image));
        assert.ok(previews[1].values.includes(scheme.threat));
        const attackBinding = previews[0].strings.findIndex(part =>
            part.includes('.attack='));
        const thwartBinding = previews[0].strings.findIndex(part =>
            part.includes('.thwart='));

        assert.equal(previews[0].values[attackBinding], character.attack);
        assert.equal(previews[0].values[thwartBinding], character.thwart);
        const showThreatBinding = previews[1].strings.findIndex(part =>
            part.includes('.showThreat='));

        assert.equal(previews[1].values[showThreatBinding], true);
        assert.ok(dialog.renderButtonCancel().values.includes('Cancelar'));
        assert.ok(dialog.renderButtonOk().values.includes('OK'));
    });
});
