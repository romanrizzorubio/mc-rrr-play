import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};

const {McListDialog} = await import(
    '../src/components/dialog/mc-list-dialog/mc-list-dialog.js'
);

describe('McListDialog option groups', () => {
    for (const text of [undefined, '']) {
        test(`omits an empty group heading (${String(text)}) without losing choices`, () => {
            const dialog = Object.create(McListDialog.prototype);
            const choices = [
                {id: '0.0', text: 'Coloca 1 de amenaza'},
                {id: '0.1', text: '+2 ATQ'},
            ];
            const content = dialog.renderItem({text, triggers: choices});

            assert.equal(content.values[0], '');
            const items = content.values[1];
            assert.equal(items.length, 2);
            assert.ok(items.every(item =>
                item.strings.join('').includes('interactive')));
            assert.ok(items.every(item => item.values.includes('')));
            assert.ok(items.every(item => !item.values.includes('submenu')));
        });
    }

    test('preserves a named heading and indents its selectable choices', () => {
        const dialog = Object.create(McListDialog.prototype);
        const content = dialog.renderItem({
            text: 'Resolver la obligación',
            triggers: [{id: '0.0', text: 'Agotar al héroe'}],
        });

        assert.match(content.values[0].strings.join(''), /title-menu/);
        assert.ok(content.values[1][0].values.includes('submenu'));
    });

    test('keeps each choice selectable by its original ID', () => {
        let responses = 0;
        const dialog = Object.assign(Object.create(McListDialog.prototype), {
            _response: {},
            sendResponse() {
                responses++;
            },
        });
        const choice = {id: '0.1', text: '+2 ATQ'};
        dialog.handleClick(choice)({stopPropagation() {}});

        assert.equal(dialog._response.selected, choice);
        assert.equal(responses, 1);
    });

    test('renders labeled context cards with a separator', () => {
        const dialog = Object.create(McListDialog.prototype);
        const sourceCard = {
            id: 'tiara',
            image: 'tiara.png',
            name: 'Tiara de la Bruja Escarlata',
        };
        const content = dialog.renderContextCards([
            {
                card: {
                    id: 'counted-card',
                    image: 'counted-card.png',
                    name: 'Carta contada',
                },
                label: 'Carta cuyo Aumento se modifica',
            },
            {
                card: {
                    id: 'scarlet-witch',
                    image: 'scarlet-witch.png',
                    name: 'Bruja Escarlata',
                },
                label: 'Bruja Escarlata',
            },
        ], sourceCard);
        const source = content.values[0];
        const cards = content.values[1];

        assert.match(content.strings.join(''), /class="context-cards"/);
        assert.match(source.strings.join(''), /context-card-source/);
        assert.match(source.strings.join(''), /<mc-card/);
        assert.equal(cards.length, 2);
        assert.equal(cards[0].values[1], 'Carta cuyo Aumento se modifica');
        assert.match(cards[0].values[2].strings.join(''), /<mc-card/);
        assert.match(
            cards[0].values[0].strings.join(''),
            /class="context-card-separator"/
        );
        assert.match(
            cards[1].values[0].strings.join(''),
            /class="context-card-separator"/
        );
        assert.equal(cards[1].values[1], 'Bruja Escarlata');
    });

    test('renders the source card left of the card being modified', () => {
        const dialog = Object.assign(Object.create(McListDialog.prototype), {
            data: {
                options: [],
                card: {
                    id: 'tiara',
                    image: 'tiara.png',
                    name: 'Tiara de la Bruja Escarlata',
                },
                contextCards: [
                    {
                        card: {
                            id: 'counted-card',
                            image: 'counted-card.png',
                            name: 'Carta contada',
                        },
                        label: 'Carta cuyo Aumento se modifica',
                    },
                ],
                showCounters: false,
            },
        });
        const content = dialog.renderContent();
        const relatedCards = content.values[0];
        const source = relatedCards.values[0];
        const [target] = relatedCards.values[1];

        assert.match(relatedCards.strings.join(''), /class="context-cards"/);
        assert.match(source.strings.join(''), /context-card-source/);
        assert.equal(target.values[1], 'Carta cuyo Aumento se modifica');
        assert.match(target.values[2].strings.join(''), /<mc-card/);
    });
});
