import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_EVENT,
    TRAIT_ATTACK,
    TRAIT_THWART,
} from 'mc-shared';

globalThis.HTMLElement ??= class {};
globalThis.window ??= {
    customElements: {
        define() {},
        get() {
            return undefined;
        },
    },
};

const {McDeckEditor} = await import(
    '../src/components/mc-deck-editor/mc-deck-editor.js'
);
const {McDeckCardPool} = await import(
    '../src/components/mc-deck-card-pool/mc-deck-card-pool.js'
);
const {McDeckApp} = await import('../src/remote-entry.js');

const templateText = template => {
    if (Array.isArray(template)) {
        return template.map(templateText).join('');
    }
    if (template?.strings && template?.values) {
        return template.strings.map((part, index) =>
            `${part}${templateText(template.values[index])}`).join('');
    }

    return typeof template === 'string' || typeof template === 'number' ||
        typeof template === 'boolean' ?
        String(template) :
        '';
};

describe('special deck-building rules', () => {
    test('shows eligible off-aspect cards, explains their limit, and counts them', () => {
        const offAspectCards = {
            maxCount: 6,
            types: [CARD_TYPE_EVENT],
            traits: [TRAIT_ATTACK, TRAIT_THWART],
        };
        const catalog = {
            hero: {
                name: 'Gamora',
                baseCardCount: 15,
                deckBuildingRules: {offAspectCards},
                fixedCards: [],
                identities: [],
            },
            aspects: [
                {id: 'justice'},
                {id: 'aggression'},
                {id: 'protection'},
                {id: 'leadership'},
            ],
            cards: [
                {
                    id: 'off-aspect-attack',
                    name: 'Ataque fuera del aspecto',
                    aspect: 'aggression',
                    type: CARD_TYPE_EVENT,
                    traits: [TRAIT_ATTACK],
                    unique: false,
                },
                {
                    id: 'off-aspect-thwart',
                    name: 'Intervención fuera del aspecto',
                    aspect: 'protection',
                    type: CARD_TYPE_EVENT,
                    traits: [TRAIT_THWART],
                    unique: false,
                },
                {
                    id: 'off-aspect-upgrade',
                    name: 'Mejora fuera del aspecto',
                    aspect: 'aggression',
                    type: 'upgrade',
                    traits: [TRAIT_ATTACK],
                    unique: false,
                },
                {
                    id: 'off-aspect-no-trait',
                    name: 'Evento sin rasgo permitido',
                    aspect: 'leadership',
                    type: CARD_TYPE_EVENT,
                    traits: [],
                    unique: false,
                },
                {
                    id: 'selected-aspect-event',
                    name: 'Evento del aspecto elegido',
                    aspect: 'justice',
                    type: CARD_TYPE_EVENT,
                    traits: [],
                    unique: false,
                },
            ],
        };
        const app = Object.assign(Object.create(McDeckApp.prototype), {
            catalog,
            deck: {aspect: 'justice', cards: []},
        });
        const editor = Object.assign(Object.create(McDeckEditor.prototype), {
            catalog,
            deck: {aspect: 'justice'},
            readOnly: false,
        });
        const cardPool = Object.assign(
            Object.create(McDeckCardPool.prototype),
            {
                cards: app.availableCards,
                search: '',
                deckAspects: ['justice'],
                offAspectCardsRule: offAspectCards,
                typeFilter: 'all',
                aspectFilter: 'all',
                traitFilter: 'all',
                addCounts: {},
                sortColumn: 'name',
                sortDirection: 'asc',
            },
        );
        const availableCards = app.availableCards;

        assert.deepEqual(
            availableCards.map(({id}) => id).sort(),
            [
                'off-aspect-attack',
                'off-aspect-thwart',
                'selected-aspect-event',
            ],
        );
        assert.deepEqual(cardPool.aspectOptions, [
            'justice',
            'aggression',
            'protection',
        ]);
        cardPool.aspectFilter = 'aggression';
        assert.deepEqual(
            cardPool.filteredCards.map(({id}) => id),
            ['off-aspect-attack'],
        );
        cardPool.aspectFilter = 'protection';
        assert.deepEqual(
            cardPool.filteredCards.map(({id}) => id),
            ['off-aspect-thwart'],
        );
        assert.doesNotMatch(
            templateText(cardPool.render()),
            /value="leadership"/u,
        );
        assert.match(
            templateText(editor.renderOffAspectCardsRule()),
            /hasta 6 cartas de otros aspectos de tipo Evento con alguno de estos rasgos: Ataque o Intervención/u,
        );
        assert.match(
            templateText(cardPool.render()),
            /Todos los aspectos permitidos y básicas/u,
        );
    });
});
