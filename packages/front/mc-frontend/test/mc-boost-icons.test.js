import assert from 'node:assert/strict';
import {test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
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

const collectTemplates = value => {
    if (Array.isArray(value)) {
        return value.flatMap(collectTemplates);
    }
    if (value && Array.isArray(value.strings) && Array.isArray(value.values)) {
        return [
            value,
            ...value.values.flatMap(collectTemplates),
        ];
    }

    return [];
};

const getBoostIconCount = markup =>
    (markup.match(/<mc-icon icon="b"><\/mc-icon>/g) || []).length;

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

    assert.match(markup, /Iconos de aumento:/);
    assert.match(markup, /Iconos de aumento acumulados:/);
    assert.equal(getBoostIconCount(markup), 5);
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
    assert.doesNotMatch(markup, /Iconos de aumento:/);
    assert.doesNotMatch(markup, /Capacidad de aumento:/);
});

test('encounter dealt dialog only enables peeking at previously seen cards', () => {
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
    const template = dialog.renderContent();
    const cardTemplates = collectTemplates(template).filter(cardTemplate =>
        cardTemplate.strings.join('').includes('<mc-card'));
    const seenCard = cardTemplates.find(cardTemplate =>
        cardTemplate.values[0] === 'Carta vista');
    const unseenCard = cardTemplates.find(cardTemplate =>
        cardTemplate.values[0] === 'Carta no vista');

    assert.equal(seenCard.values[3], true);
    assert.equal(seenCard.values[4], true);
    assert.equal(unseenCard.values[3], true);
    assert.equal(unseenCard.values[4], false);
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
    };
    const markup = renderTemplate(dialog.renderContent());

    assert.match(markup, /Iconos de aumento:/);
    assert.equal(getBoostIconCount(markup), 2);

    dialog.data.card.boost = 0;
    const zeroBoostMarkup = renderTemplate(dialog.renderContent());

    assert.doesNotMatch(zeroBoostMarkup, /Iconos de aumento/);
    assert.equal(getBoostIconCount(zeroBoostMarkup), 0);
});
