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

test('basic activation confirmation titles the action and shows unlabeled cards without a subtitle', () => {
    const hero = {
        image: 'heroes/spiderman/peter1.webp',
        name: 'Spider-Man',
    };
    const target = {
        id: 'main-scheme',
        image: 'scenarios/rhino/main-scheme.webp',
        isMainScheme: true,
        name: 'Breakin & Takin',
        threat: 2,
    };
    const dialog = Object.assign(Object.create(McConfirmDialog.prototype), {
        data: {
            basicActivation: {
                activationType: 'thwart',
                superhero: hero,
                target,
            },
            cancelText: 'Cancelar',
        },
        _dontShowBasicActivationConfirmation: false,
        subtitle: '',
    });
    const content = dialog.renderContent();
    const previews = content.values.filter(value =>
        value?.strings?.join('').includes('basic-activation-card')
    );

    assert.equal(previews.length, 2);
    assert.equal(dialog.getTitle(), '¿Quieres realizar esta intervención?');
    assert.equal(dialog.getSubtitle(), '');
    assert.equal(dialog.renderSubtitle(), '');
    assert.ok(!content.strings.join('').includes('Tipo de activación'));
    assert.ok(!content.values.includes('Superhéroe'));
    assert.ok(!content.values.includes('Objetivo'));
    assert.ok(content.strings.join('').includes('type="checkbox"'));
    assert.ok(dialog.renderButtonOk().values.includes('Ok'));
    assert.ok(dialog.renderButtonCancel().values.includes('Cancelar'));

    dialog.data.basicActivation.activationType = 'attack';
    assert.equal(dialog.getTitle(), '¿Quieres realizar este ataque?');

    const targetPreview = dialog.renderBasicActivationCard(target);
    assert.equal(targetPreview.values.at(-1), true);
});

test('basic activation confirmation shows the ally that will perform the activation', () => {
    const ally = {
        image: 'allies/ally-card.webp',
        name: 'Hawkeye',
    };
    const dialog = Object.assign(Object.create(McConfirmDialog.prototype), {
        data: {
            basicActivation: {
                activationType: 'attack',
                activator: ally,
                target: {image: 'enemies/enemy.webp', name: 'Rhino'},
            },
        },
        _dontShowBasicActivationConfirmation: false,
    });

    const content = dialog.renderContent();
    const previews = content.values.filter(value =>
        value?.strings?.join('').includes('basic-activation-card')
    );

    assert.equal(previews.length, 2);
    assert.ok(previews[0].values.includes(ally.image));
});

test('basic activation confirmation returns the selected hide-dialog preference', () => {
    const dialog = Object.assign(Object.create(McConfirmDialog.prototype), {
        data: {basicActivation: {}},
        _dontShowBasicActivationConfirmation: true,
    });
    let response;
    dialog.dispatchEvent = event => {
        response = event.detail;
    };

    dialog.sendResponse();

    assert.deepEqual(response, {
        confirmed: true,
        skipBasicActivationConfirmation: true,
    });
});
