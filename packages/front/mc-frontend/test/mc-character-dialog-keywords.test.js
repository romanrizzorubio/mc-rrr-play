import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    mcStaticRemote: {
        getAssetUrl(path) {
            return path;
        },
    },
    customElements: {
        define() {},
    },
};

const [
    {McActivateDialog},
    {McAssignDialog},
    {McConfirmDialog},
    {McDefense},
] = await Promise.all([
    import('../src/components/dialog/mc-activate-dialog/mc-activate-dialog.js'),
    import('../src/components/dialog/mc-assign-dialog/mc-assign-dialog.js'),
    import('../src/components/dialog/mc-confirm-dialog/mc-confirm-dialog.js'),
    import('../src/components/panels/mc-defense/mc-defense.js'),
]);

describe('dialog character acquired keywords', () => {
    const extraKeywords = [{name: 'retaliate', value: 1}];

    const assertKeywordsArePassed = (template, keywords) => {
        assert.match(template.strings.join(''), /\.extraKeywords=/);
        assert.ok(template.values.includes(keywords));
    };

    test('activation dialog passes acquired keywords to each character card', () => {
        const character = {
            extraKeywords,
            image: 'characters/character.webp',
            name: 'Personaje',
        };

        assertKeywordsArePassed(
            McActivateDialog.prototype.renderCharacterCard(character),
            extraKeywords
        );
    });

    test('basic activation confirmation passes acquired keywords', () => {
        const character = {
            extraKeywords,
            image: 'characters/character.webp',
            name: 'Personaje',
        };

        assertKeywordsArePassed(
            McConfirmDialog.prototype.renderBasicActivationCard(character),
            extraKeywords
        );
    });

    test('indirect damage assignment passes acquired keywords', () => {
        const character = {
            extraKeywords,
            id: 'character',
            image: 'characters/character.webp',
            life: 3,
            name: 'Personaje',
        };
        const dialog = Object.assign(
            Object.create(McAssignDialog.prototype),
            {
                data: {
                    cards: [character],
                    count: 1,
                    field: 'life',
                },
                _response: {assigned: {character: 1}},
            }
        );

        assertKeywordsArePassed(dialog.renderCard(character), extraKeywords);
    });

    test('defense dialog passes acquired keywords for the attacking character', () => {
        const character = {
            extraKeywords,
            image: 'characters/character.webp',
            name: 'Personaje',
        };
        const dialog = Object.assign(Object.create(McDefense.prototype), {
            attack: {character},
        });

        assertKeywordsArePassed(dialog.renderEnemy(), extraKeywords);
    });
});
