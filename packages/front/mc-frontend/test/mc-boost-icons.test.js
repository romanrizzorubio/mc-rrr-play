import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    mcStaticRemote: {getAssetUrl: path => path},
    customElements: {
        define() {},
    },
};

const {McBoostDealtDialog} = await import(
    '../src/components/dialog/mc-boost-dealt-dialog/mc-boost-dealt-dialog.js'
);
const {McEncountersRevealDialog} = await import(
    '../src/components/dialog/mc-encounters-reveal-dialog/mc-encounters-reveal-dialog.js'
);
const {McEncountersDealtDialog} = await import(
    '../src/components/dialog/mc-encounters-dealt-dialog/mc-encounters-dealt-dialog.js'
);

describe('boost icon and encounter card presentation', () => {
const renderTemplate = value => {
    if (Array.isArray(value)) {
        return value.map(renderTemplate).join('');
    }
    if (value && Array.isArray(value.strings) && Array.isArray(value.values)) {
        return value.strings.map((part, index) =>
            `${part}${renderTemplate(value.values[index])}`
        ).join('');
    }
    if (value === null || value === undefined || typeof value === 'boolean') {
        return '';
    }

    return String(value);
};

const getBoostIconCount = markup =>
    (markup.match(/<mc-icon icon="b"><\/mc-icon>/g) || []).length;
const getAmplificationIconCount = markup =>
    (markup.match(/<mc-icon icon="F"><\/mc-icon>/g) || []).length;

test('boost dealt dialog renders boost icons and accumulated icons instead of counts', () => {
    const dialog = Object.create(McBoostDealtDialog.prototype);
    dialog.data = {
        allowHideFuture: false,
        cardCount: 1,
        cards: [{
            card: {
                name: 'Carta de prueba',
                image: 'test.png',
                boost: 2,
                counters: 0,
            },
            horizontal: false,
            hasBoostAbility: false,
        }],
        cumulativeBoost: 3,
    };
    const markup = renderTemplate(dialog.renderContent());

    assert.match(markup, /Iconos de aumento/);
    assert.match(markup, /Iconos de aumento acumulados/);
    assert.equal(getBoostIconCount(markup), 5);
});

test('boost dealt dialog shows effective boost and amplification icons', () => {
    const dialog = Object.create(McBoostDealtDialog.prototype);
    dialog.data = {
        allowHideFuture: false,
        cardCount: 1,
        cards: [{
            card: {
                name: 'Carta de prueba',
                image: 'test.png',
                boost: 3,
                counters: 0,
            },
            appliedAmplificationIcons: 2,
            horizontal: false,
            hasBoostAbility: false,
        }],
        cumulativeBoost: 3,
    };
    const markup = renderTemplate(dialog.renderContent());

    assert.match(markup, /Iconos de aumento/);
    assert.match(
        markup,
        /<div class="boost-amplification-row">\s*<strong>\s*Bonificador de amplificación\s*\(\+2\)\s*<\/strong>\s*<span class="boost-icon-list">/u
    );
    assert.equal(getBoostIconCount(markup), 6);
    assert.equal(getAmplificationIconCount(markup), 2);
});

test('boost dealt dialog omits icon labels when the card and total have no icons', () => {
    const dialog = Object.create(McBoostDealtDialog.prototype);
    dialog.data = {
        allowHideFuture: false,
        cardCount: 1,
        cards: [{
            card: {
                name: 'Carta de prueba',
                image: 'test.png',
                boost: 0,
                counters: 0,
            },
            horizontal: false,
            hasBoostAbility: false,
        }],
        cumulativeBoost: 0,
    };
    const markup = renderTemplate(dialog.renderContent());

    assert.doesNotMatch(markup, /Iconos de aumento/);
    assert.equal(getBoostIconCount(markup), 0);
});

test('boost dealt dialog lets players peek at future facedown boost cards', () => {
    const dialog = Object.create(McBoostDealtDialog.prototype);
    dialog.data = {
        cardCount: 2,
        cards: [
            {
                card: {
                    name: 'Carta actual',
                    image: 'current.png',
                    boost: 0,
                },
                hasBoostAbility: false,
            },
            {
                card: {
                    name: 'Carta futura',
                    image: 'future.png',
                    boost: 2,
                    isFacedownCard: true,
                    canPeekFacedown: true,
                },
                appliedAmplificationIcons: 2,
                hasBoostAbility: true,
            },
        ],
        cumulativeBoost: 0,
    };
    const template = dialog.renderContent();
    const markup = renderTemplate(template);
    const futureCard = template.values[0][1];

    assert.equal(futureCard.values[3], true);
    assert.equal(futureCard.values[4], true);
    assert.doesNotMatch(markup, /Iconos de aumento/);
    assert.doesNotMatch(markup, /Capacidad de aumento/);
    assert.equal(getAmplificationIconCount(markup), 0);
});

test('encounter dealt summary never exposes identities or enables peeking', () => {
    const dialog = Object.create(McEncountersDealtDialog.prototype);
    dialog.data = {
        encounters: [{
            name: 'Hulka',
            count: 2,
            cards: [
                {
                    id: 'seen-encounter',
                    name: 'Carta vista',
                    image: 'seen.png',
                    canPeekFacedown: true,
                },
                {
                    id: 'unseen-encounter',
                    name: 'Carta no vista',
                    image: 'unseen.png',
                    canPeekFacedown: false,
                },
            ],
        }],
        hazardIcons: 0,
    };
    const markup = renderTemplate(dialog.renderContent());
    assert.match(markup, /Hulka/u);
    assert.match(markup, /aria-label="2 cartas repartidas"/u);
    assert.equal((markup.match(/<mc-card-image\b/gu) || []).length, 1);
    assert.doesNotMatch(markup, /Carta vista|Carta no vista|seen\.png|unseen\.png|canPeek|<mc-card(?:\s|>)/u);
});

test('encounter reveal dialog renders boost icons and omits the label at zero', () => {
    const dialog = Object.create(McEncountersRevealDialog.prototype);
    dialog.data = {
        isBoost: true,
        hasBoostAbility: false,
        horizontal: false,
        card: {
            name: 'Carta de prueba',
            image: 'test.png',
            boost: 2,
        },
        appliedAmplificationIcons: 1,
    };
    const markup = renderTemplate(dialog.renderContent());

    assert.match(markup, /Iconos de aumento/);
    assert.match(
        markup,
        /<div class="boost-amplification-row">\s*<strong>\s*Bonificador de amplificación\s*\(\+1\)\s*<\/strong>\s*<span class="boost-icon-list">/u
    );
    assert.equal(getBoostIconCount(markup), 2);
    assert.equal(getAmplificationIconCount(markup), 1);

    dialog.data.card.boost = 0;
    dialog.data.appliedAmplificationIcons = 0;
    const zeroBoostMarkup = renderTemplate(dialog.renderContent());

    assert.doesNotMatch(zeroBoostMarkup, /Iconos de aumento/);
    assert.equal(getBoostIconCount(zeroBoostMarkup), 0);
    assert.equal(getAmplificationIconCount(zeroBoostMarkup), 0);
});
});
