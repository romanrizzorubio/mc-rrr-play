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

const {CardComponent} = await import(
    '../src/components/cards/mc-card/mc-card.js'
);

describe('facedown minion card display', () => {
    const createCard = isMinion => Object.assign(
        Object.create(CardComponent.prototype),
        {
            activationActor: {abilities: []},
            attack: 2,
            card: {isMinion},
            defense: undefined,
            dragActivation: null,
            dragPlayCard: null,
            dragResourcePayment: null,
            exhausted: false,
            extraKeywords: [],
            extraTraits: [],
            faceDown: [],
            facedownImage: '',
            handSize: undefined,
            hitPoints: 3,
            horizontal: false,
            image: 'secret-source-card.png',
            isFacedownCard: true,
            life: 2,
            name: 'Dron boca abajo',
            recovery: undefined,
            rotated: false,
            scheme: 1,
            showBasicStats: true,
            showDamage: false,
            showGeneric: false,
            showThreat: false,
            size: 's',
            statusCards: {},
            threat: undefined,
            thwart: undefined,
            tuckedCards: [],
            unprintedStats: [],
            emphasizedStats: [],
            damage: undefined,
            renderHeader: () => '',
            renderStage: () => '',
            renderFacedownPeekButton: () => '',
            renderCounters: () => '',
            renderAcquiredTraits: () => '',
            renderAcquiredKeywords: () => '',
            renderAttached: () => '',
            renderFaceDown: () => '',
            renderMenu: () => '',
        },
    );

    const flattenTemplate = value => {
        if (Array.isArray(value)) {
            return value.map(flattenTemplate).join('');
        }
        if (typeof value === 'string' || typeof value === 'number') {
            return String(value);
        }
        if (value?.strings && value?.values) {
            return value.strings.map((part, index) =>
                `${part}${index < value.values.length ?
                    flattenTemplate(value.values[index]) :
                    ''}`
            ).join('');
        }

        return '';
    };

    test('shows attributes and life while keeping a facedown minion concealed', () => {
        const card = createCard(true);
        const markup = flattenTemplate(card.renderCard());

        assert.match(markup, /aria-label="ATQ: 2"/);
        assert.match(markup, /aria-label="PLA: 1"/);
        assert.match(markup, /aria-label="VIDA: 2\/3"/);
        assert.match(markup, /src="images\/cards\/back\/player\.jpg"/);
        assert.doesNotMatch(markup, /secret-source-card\.png/);
        assert.equal(card.getDisplayName(), 'Carta boca abajo');
    });

    test('keeps stats hidden on other facedown cards', () => {
        const card = createCard(false);
        const markup = flattenTemplate(card.renderCard());

        assert.doesNotMatch(markup, /aria-label="ATQ: 2"/);
        assert.doesNotMatch(markup, /aria-label="PLA: 1"/);
        assert.doesNotMatch(markup, /aria-label="VIDA: 2\/3"/);
        assert.match(markup, /src="images\/cards\/back\/player\.jpg"/);
    });
});
