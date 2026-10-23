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
globalThis.CustomEvent = class {
    constructor(type, options = {}) {
        this.type = type;
        Object.assign(this, options);
    }
};

const {CardComponent} = await import(
    '../src/components/cards/mc-card/mc-card.js'
);

describe('side-scheme tucked-card presentation', () => {
    test('shows face-up tucked cards below the scheme and labels below them', () => {
        const tuckedTab = {};
        const counters = {};
        const bottomStats = {};
        const stats = {};
        const card = Object.assign(Object.create(CardComponent.prototype), {
            activationActor: {abilities: []},
            card: {isSideScheme: true},
            dragActivation: null,
            dragPlayCard: null,
            dragResourcePayment: null,
            exhausted: false,
            faceDown: [],
            horizontal: true,
            image: 'side-scheme.png',
            isFacedownCard: false,
            name: 'Side Scheme',
            rotated: false,
            size: 'm',
            tuckedCards: [{image: 'mockingbird.png'}],
            renderHeader: () => '',
            renderStats: () => stats,
            renderTucked: () => tuckedTab,
            renderStage: () => '',
            renderFacedownPeekButton: () => '',
            renderCounters: () => counters,
            renderBottomStats: () => bottomStats,
            renderAcquiredTraits: () => '',
            renderAcquiredKeywords: () => '',
            renderAttached: () => '',
            renderFaceDown: () => '',
            renderMenu: () => '',
        });
        const template = card.renderCard();
        const indexOf = value => template.values.indexOf(value);

        assert.ok(indexOf(tuckedTab) >= 0);
        assert.ok(indexOf(tuckedTab) < indexOf(counters));
        assert.ok(indexOf(counters) < indexOf(bottomStats));
        assert.ok(indexOf(bottomStats) < indexOf(stats));
    });

    test('shows only a small tab for face-up cards tucked under a side scheme', () => {
        const card = Object.assign(Object.create(CardComponent.prototype), {
            card: {isSideScheme: true},
            dragActivation: null,
            dragPlayCard: null,
            dragResourcePayment: null,
            faceDown: [],
            size: 'm',
            tuckedCards: [{image: 'mockingbird.png'}],
        });
        const template = card.renderTucked();
        const previews = template.values.find(Array.isArray);

        assert.match(
            template.strings.join(''),
            /class="tucked .*"/
        );
        assert.equal(template.values[0], 'side-scheme-tucked');
        assert.equal(previews.length, 1);
        assert.ok(
            previews[0].strings.join('').includes('class="tucked-card-peek"')
        );
        assert.equal(previews[0].values[1], 's');
        assert.match(
            CardComponent.styles.cssText,
            /\.tucked\.side-scheme-tucked\s*\{[^}]*position: static;[^}]*height: 16px;/s
        );
        assert.match(
            CardComponent.styles.cssText,
            /\.tucked-card-peek\s*\{[^}]*height: 16px/s
        );
    });
});
