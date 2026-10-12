import assert from 'node:assert/strict';
import {test} from 'node:test';

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

test('renders tucked cards as a short visible strip beneath the host card', () => {
    const card = Object.assign(Object.create(CardComponent.prototype), {
        tuckedCards: [
            {image: 'tucked-one.png'},
            {image: 'tucked-two.png'},
            {image: 'tucked-three.png'},
        ],
        size: 'm',
    });
    const template = card.renderTucked();
    const styles = CardComponent.styles.cssText;

    assert.equal(template.values[0].length, 2);
    assert.ok(template.values[0].every(preview =>
        preview.strings.join('').includes('class="tucked-card-peek"')
    ));
    assert.deepEqual(
        template.values[0].map(preview => preview.values[0]),
        [
            'images/cards/tucked-one.png',
            'images/cards/tucked-two.png',
        ]
    );
    assert.match(styles, /top: calc\(100% - 8px\)/);
    assert.match(styles, /height: 16px/);
    assert.match(styles, /\.tucked-card-peek\s*\{[^}]*align-items: flex-end/s);
});
