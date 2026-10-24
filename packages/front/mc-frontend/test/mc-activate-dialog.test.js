import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

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

describe('McActivateDialog', () => {
    test('shows standard stats for both characters', () => {
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

    test('spaces and centers title-style VS between the activation cards', () => {
        const [, activateDialogStyles] = McActivateDialog.styles;
        const vsRule = activateDialogStyles.cssText.match(/\.vs\s*\{([^}]*)\}/)?.[1];

        assert.ok(vsRule);
        assert.match(vsRule, /align-self:\s*center/);
        assert.match(vsRule, /margin-left:\s*0\.75em/);
        assert.match(
            vsRule,
            /font-family:\s*var\(--mc-font-title,\s*sans-serif\)/
        );
    });
});
