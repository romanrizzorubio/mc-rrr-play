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

describe('tucked and facedown card presentation', () => {
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

    test('shows facedown cards under any host as small card-back peeks, not linked cards', () => {
        const counters = {};
        const card = Object.assign(Object.create(CardComponent.prototype), {
            activationActor: {abilities: []},
            card: {isObligation: true},
            dragActivation: null,
            dragPlayCard: null,
            dragResourcePayment: null,
            exhausted: false,
            faceDown: [{isEncounterCard: true}],
            horizontal: false,
            image: 'obligation.png',
            isFacedownCard: false,
            name: 'Obligation',
            rotated: false,
            size: 'm',
            tuckedCards: [],
            renderHeader: () => '',
            renderStats: () => '',
            renderStage: () => '',
            renderFacedownPeekButton: () => '',
            renderCounters: () => counters,
            renderBottomStats: () => '',
            renderAcquiredTraits: () => '',
            renderAcquiredKeywords: () => '',
            renderAttached: () => '',
            renderMenu: () => '',
        });
        const renderTucked = card.renderTucked.bind(card);
        let tuckedTab;
        card.renderTucked = () => {
            tuckedTab = renderTucked();

            return tuckedTab;
        };
        const template = card.renderCard();
        const previews = tuckedTab.values.find(Array.isArray);
        const countersIndex = template.values.indexOf(counters);

        assert.ok(template.values.includes(tuckedTab));
        assert.equal(tuckedTab.values[0], 'facedown-host');
        assert.deepEqual(
            previews.map(preview => preview.values[0]),
            ['images/cards/back/encounter.jpg']
        );
        assert.ok(template.values.indexOf(tuckedTab) < countersIndex);
        assert.equal(card.renderFaceDown().strings.join(''), '');
        assert.match(
            CardComponent.styles.cssText,
            /\.tucked\.facedown-host\s*\{[^}]*position: static;[^}]*height: 16px;/s
        );
    });

    test('shows future boost backs to the lower left without treating them as tucked cards', () => {
        const card = Object.assign(Object.create(CardComponent.prototype), {
            card: {isVillain: true},
            faceDown: [{
                id: 'hidden-boost',
                image: 'secret-boost.png',
                isEncounterCard: true,
                isFutureBoost: true,
                name: 'Secret boost',
            }],
            size: 'm',
            tuckedCards: [],
        });
        const futureBoosts = card.renderFutureBoosts();

        assert.equal(card.getFaceDownPeekCards().length, 0);
        assert.equal(card.renderTucked().strings.join(''), '');
        assert.equal(card.renderFaceDown().strings.join(''), '');
        assert.match(futureBoosts.strings.join(''), /class="future-boosts"/);
        assert.equal(futureBoosts.values[0], 1);
        assert.equal(
            futureBoosts.values[1],
            'images/cards/back/encounter.jpg'
        );
        assert.equal(futureBoosts.values[2], 's');
        assert.equal(futureBoosts.values[4], '');
        assert.doesNotMatch(
            JSON.stringify(futureBoosts.values),
            /hidden-boost|secret-boost|Secret boost/
        );
        assert.match(
            CardComponent.styles.cssText,
            /\.future-boosts\s*\{[^}]*right: calc\(100% \+ 6px\);[^}]*bottom: 0;/s
        );
    });

    test('anchors future boosts at the lower left of the host image without shifting stats', () => {
        const stats = {};
        const futureBoosts = {};
        const tuckedTab = {};
        const card = Object.assign(Object.create(CardComponent.prototype), {
            activationActor: {abilities: []},
            card: {isVillain: true},
            dragActivation: null,
            dragPlayCard: null,
            dragResourcePayment: null,
            exhausted: false,
            faceDown: [{isEncounterCard: true, isFutureBoost: true}],
            horizontal: false,
            image: 'villain.png',
            isFacedownCard: false,
            name: 'Villain',
            rotated: false,
            size: 'm',
            tuckedCards: [],
            renderHeader: () => '',
            renderStats: () => stats,
            renderFutureBoosts: () => futureBoosts,
            renderTucked: () => tuckedTab,
            renderStage: () => '',
            renderFacedownPeekButton: () => '',
            renderCounters: () => '',
            renderBottomStats: () => '',
            renderAcquiredTraits: () => '',
            renderAcquiredKeywords: () => '',
            renderAttached: () => '',
            renderFaceDown: () => '',
            renderMenu: () => '',
        });
        const template = card.renderCard();
        const futureBoostIndex = template.values.indexOf(futureBoosts);

        assert.ok(template.values.indexOf(stats) < futureBoostIndex);
        assert.ok(template.values.indexOf(futureBoosts) >= 0);
        assert.ok(
            template.strings[futureBoostIndex].includes('</mc-card-image>')
        );
        assert.match(
            CardComponent.styles.cssText,
            /\.card-image-container\s*\{[^}]*position: relative;/s
        );
        assert.match(
            CardComponent.styles.cssText,
            /\.future-boosts\s*\{[^}]*position: absolute;[^}]*right: calc\(100% \+ 6px\);[^}]*bottom: 0;/s
        );
    });

    test('shows a count when multiple future boost backs are grouped', () => {
        const card = Object.assign(Object.create(CardComponent.prototype), {
            dragActivation: null,
            dragPlayCard: null,
            dragResourcePayment: null,
            faceDown: [
                {isEncounterCard: true, isFutureBoost: true},
                {isEncounterCard: true, isFutureBoost: true},
            ],
            size: 'm',
        });
        const futureBoosts = card.renderFutureBoosts();
        const count = futureBoosts.values[4];

        assert.equal(futureBoosts.values[0], 2);
        assert.match(count.strings.join(''), /future-boost-count/);
        assert.equal(count.values[0], 2);
    });
});
