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
    const renderTemplate = value => {
        if (Array.isArray(value)) {
            return value.map(renderTemplate).join('');
        }
        if (value?.strings && value?.values) {
            return value.strings.map((part, index) =>
                part + renderTemplate(value.values[index])).join('');
        }
        return typeof value === 'string' ? value : '';
    };

    test('only the affected player has buttons and can interact with the activation', () => {
        for (const readOnly of [false, true]) {
            const dialog = Object.assign(Object.create(McActivateDialog.prototype), {
                readOnly,
                title: 'Villano ataca a Héroe',
                subtitle: 'Activación del villano',
                targetPlayerName: 'Héroe',
                showCancel: true,
                hideOk: false,
                hand: readOnly ? [] : [{id: 'hand-card'}],
                data: {
                    character: {name: 'Villano', image: 'enemy.png', isFacedownCard: true},
                    target: {name: 'Héroe', image: 'hero.png'},
                },
            });
            const markup = renderTemplate(dialog.render());
            const card = dialog.renderCharacterCard(dialog.data.character);
            const peekIndex = card.strings.findIndex(part => part.endsWith('.canPeekFacedown="'));
            assert.equal(card.values[peekIndex], !readOnly);
            assert.match(markup, /Villano|Héroe/u);
            assert.match(markup, /class="vs">VS/u);
            assert.doesNotMatch(markup, /Héroe responsable/u);
            assert.match(markup, /Activación del villano[\s\S]*class="activation-cards"/u);
            if (readOnly) {
                assert.doesNotMatch(markup, />Ok<\/md-text-button>|>Cancelar<\/md-text-button>|Ver mano/u);
                assert.match(markup, /Ver mesa/u);
                assert.match(markup, /<div inert>/u);
                const events = [];
                dialog.dispatchEvent = event => events.push(event);
                dialog.sendResponse();
                dialog.handleOk();
                dialog.handleCancel();
                dialog.handleViewTable();
                assert.deepEqual(events.map(event => event.type), ['dialog-view-table']);
            } else {
                assert.match(markup, />Ok<\/md-text-button>/u);
                assert.match(markup, /Cancelar|Ver mesa/u);
                assert.doesNotMatch(markup, /<div inert>/u);
            }
        }
    });

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
        assert.match(activateDialogStyles.cssText,
            /\.activation-cards\s*\{[^}]*display:\s*flex;/u);
        assert.doesNotMatch(activateDialogStyles.cssText,
            /\.activate \.content\s*\{[^}]*display:\s*flex;/u);
    });

    test('skipped activations still identify the responsible hero when no target card is shown', () => {
        const dialog = Object.assign(Object.create(McActivateDialog.prototype), {
            title: 'Activación omitida', subtitle: '', footer: '',
            targetPlayerName: 'Carol Danvers', readOnly: true, hand: [],
            data: {target: {name: 'Carol Danvers'}, statusType: 'stunned',
                statusMessage: 'El villano está aturdido.'},
        });
        const markup = renderTemplate(dialog.renderDialog());
        assert.match(markup, /Héroe responsable: Carol Danvers/u);
        assert.match(markup, /activation-status-image/u);
        assert.doesNotMatch(markup, /activation-cards/u);
    });
});
