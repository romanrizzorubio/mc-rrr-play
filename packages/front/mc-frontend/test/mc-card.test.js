import assert from 'node:assert/strict';
import {test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};

const {CardComponent} = await import(
    '../src/components/cards/mc-card/mc-card.js'
);
const {ICON_STAR} = await import(
    '../src/components/common/mc-icon/mc-icon.js'
);

const renderStats = ({attack, scheme, defense, unprintedStats}) => {
    const card = Object.assign(Object.create(CardComponent.prototype), {
        showBasicStats: true,
        nameWithStage: false,
        stage: undefined,
        attack,
        scheme,
        defense,
        thwart: undefined,
        recovery: undefined,
        unprintedStats,
    });

    return card.renderStats();
};

const getStatValue = (template, label) => {
    const stats = template.values.find(Array.isArray);
    const stat = stats.find(({values}) => values[1] === label);

    return stat.values[3];
};

test('renders the Marvel Champions star for marked unprinted stats that equal zero', () => {
    const template = renderStats({
        attack: 0,
        scheme: 0,
        defense: 0,
        unprintedStats: ['attack', 'scheme'],
    });
    const attack = getStatValue(template, 'ATQ');
    const scheme = getStatValue(template, 'PLA');
    const defense = getStatValue(template, 'DEF');

    assert.match(attack.strings.join(''), /class="stat-star"/);
    assert.match(attack.strings.join(''), /<mc-icon icon=/);
    assert.equal(attack.values[0], ICON_STAR);
    assert.match(scheme.strings.join(''), /class="stat-star"/);
    assert.match(scheme.strings.join(''), /<mc-icon icon=/);
    assert.equal(scheme.values[0], ICON_STAR);
    assert.match(defense.strings.join(''), /numeric-value/);
    assert.equal(defense.values[0], 0);
});

test('renders the calculated value when an unprinted stat becomes nonzero', () => {
    const template = renderStats({
        attack: 1,
        scheme: 0,
        defense: 0,
        unprintedStats: ['attack', 'scheme'],
    });
    const attack = getStatValue(template, 'ATQ');

    assert.match(attack.strings.join(''), /numeric-value/);
    assert.equal(attack.values[0], 1);
});
