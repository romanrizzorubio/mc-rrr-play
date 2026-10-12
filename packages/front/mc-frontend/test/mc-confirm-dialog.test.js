import assert from 'node:assert/strict';
import {test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};

const {McConfirmDialog} = await import(
    '../src/components/dialog/mc-confirm-dialog/mc-confirm-dialog.js'
);

test('confirmation dialog uses configured OK and cancel button labels', () => {
    const dialog = Object.assign(Object.create(McConfirmDialog.prototype), {
        data: {
            okText: 'OK',
            cancelText: 'Cancelar',
        },
    });

    assert.ok(dialog.renderButtonOk().values.includes('OK'));
    assert.ok(dialog.renderButtonCancel().values.includes('Cancelar'));
});

test('confirmation dialog keeps its existing button labels by default', () => {
    const dialog = Object.assign(Object.create(McConfirmDialog.prototype), {
        data: {},
    });

    assert.ok(dialog.renderButtonOk().values.includes('Sí, finalizar el turno'));
    assert.ok(dialog.renderButtonCancel().values.includes('No, seguir jugando'));
});

test('confirmation dialog displays the card and boost icons instead of a count', () => {
    const card = {
        image: 'encounters/boost-card.png',
        isSideScheme: true,
        name: 'Esquema de aumento',
    };
    const dialog = Object.assign(Object.create(McConfirmDialog.prototype), {
        data: {
            card,
            boostIconCount: 3,
        },
        subtitle: '',
    });

    const content = dialog.renderContent();
    const cardPreview = content.values.find(value =>
        value?.strings?.join('').includes('<mc-card')
    );
    const boostIconPreview = content.values.find(value =>
        value?.strings?.join('').includes('boost-icon-list')
    );

    assert.ok(cardPreview);
    assert.ok(cardPreview.values.includes(card.image));
    assert.equal(cardPreview.values.at(-1), true);
    assert.ok(boostIconPreview);
    assert.equal(boostIconPreview.values[1].length, 3);
    assert.equal(
        dialog.getSubtitle(),
        '¿Continuar y pagar el coste del evento?'
    );
    assert.ok(dialog.renderButtonOk().values.includes('OK'));
    assert.ok(dialog.renderButtonCancel().values.includes('Cancelar'));
});

test('confirmation dialog displays the contextual card and damage prevented', () => {
    const card = {
        image: 'heroes/spiderman/peter1.webp',
        name: 'Spider-Man',
    };
    const dialog = Object.assign(Object.create(McConfirmDialog.prototype), {
        data: {
            card,
            reasons: ['Daño que se evitará: 3'],
        },
    });

    const content = dialog.renderContent();
    const cardPreview = content.values.find(value =>
        value?.strings?.join('').includes('<mc-card')
    );
    const reasonList = content.values.find(value =>
        value?.strings?.join('').includes('Motivos de la confirmación')
    );

    assert.ok(cardPreview);
    assert.ok(cardPreview.values.includes(card.image));
    assert.ok(reasonList.values[0].some(reason =>
        reason.values.includes('Daño que se evitará: 3')
    ));
});

test('damage-prevention confirmation uses its shared dialog copy', () => {
    const dialog = Object.assign(Object.create(McConfirmDialog.prototype), {
        data: {
            preventedDamage: 1,
        },
        subtitle: '',
    });

    const content = dialog.renderContent();
    const damagePreview = content.values.find(value =>
        value?.strings?.join('').includes('<ul class="reasons"')
    );

    assert.equal(
        dialog.getSubtitle(),
        '¿Continuar con esta Interrupción?'
    );
    assert.ok(damagePreview);
    assert.deepEqual(damagePreview.values, ['Daño que se evitará', 1]);
    assert.ok(dialog.renderButtonOk().values.includes('OK'));
    assert.ok(dialog.renderButtonCancel().values.includes('Cancelar'));
});

test('confirmation dialog shows enemy attack and defense bonus details', () => {
    const dialog = Object.assign(Object.create(McConfirmDialog.prototype), {
        data: {
            defenseBonus: {
                enemyName: 'Rhino',
                attackValue: 2,
                defenderName: 'Spider-Man',
                defenseValue: 3,
                bonus: 3,
                totalDefense: 6,
            },
        },
        subtitle: '',
    });

    const content = dialog.renderContent();
    const preview = content.values.find(value =>
        value?.strings?.join('').includes('defense-bonus-preview')
    );

    assert.ok(preview);
    assert.deepEqual(preview.values, [
        'Rhino',
        2,
        'Spider-Man',
        3,
        3,
        6,
    ]);
    assert.equal(
        dialog.getSubtitle(),
        '¿Continuar con esta Interrupción?'
    );
    assert.ok(dialog.renderButtonOk().values.includes('OK'));
    assert.ok(dialog.renderButtonCancel().values.includes('Cancelar'));
});
