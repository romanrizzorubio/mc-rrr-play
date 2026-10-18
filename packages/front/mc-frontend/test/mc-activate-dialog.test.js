import assert from 'node:assert/strict';
import {test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
    mcStaticRemote: {
        getAssetUrl(path) {
            return path;
        },
    },
};

const {McActivateDialog} = await import(
    '../src/components/dialog/mc-activate-dialog/mc-activate-dialog.js'
);

test('activation dialog shows standard stats for both characters', () => {
    const character = {
        name: 'Villano',
        image: 'villain.png',
        attack: 3,
        scheme: 2,
        thwart: 1,
        defense: 2,
        recovery: 0,
        life: 12,
        hitPoints: 16,
    };
    const target = {
        name: 'Héroe',
        image: 'hero.png',
        attack: 2,
        scheme: 1,
        thwart: 2,
        defense: 3,
        recovery: 3,
        life: 8,
        hitPoints: 10,
    };
    const dialog = Object.assign(Object.create(McActivateDialog.prototype), {
        data: {
            character,
            target,
            emphasizedStat: 'attack',
            statusMessage: '',
            statusType: '',
        },
    });

    const [characterCard, targetCard] = dialog.renderContent().values;

    for (const [cardTemplate, card] of [
        [characterCard, character],
        [targetCard, target],
    ]) {
        const template = cardTemplate.strings.join('');

        assert.match(template, /show-basic-stats/);
        assert.doesNotMatch(template, /show-stat-labels/);
        assert.ok(cardTemplate.values.includes(card.attack));
        assert.ok(cardTemplate.values.includes(card.scheme));
        assert.ok(cardTemplate.values.includes(card.thwart));
        assert.ok(cardTemplate.values.includes(card.defense));
        assert.ok(cardTemplate.values.includes(card.recovery));
    }

    assert.ok(characterCard.values.some(value =>
        Array.isArray(value) && value.includes('attack')
    ));
    assert.ok(!targetCard.values.some(value =>
        Array.isArray(value) && value.includes('attack')
    ));
});
