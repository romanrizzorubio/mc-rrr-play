import assert from 'node:assert/strict';
import {test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};

const {HandComponent: McCardList} = await import(
    '../src/components/cards/mc-card-list/mc-card-list.js'
);
const {CardComponent} = await import(
    '../src/components/cards/mc-card/mc-card.js'
);

const renderCardClass = (playable, disabledCards = []) => {
    const list = Object.assign(Object.create(McCardList.prototype), {
        size: 'm',
        marked: [],
        disabledCards,
        showBasicStats: false,
        showAcquiredTraits: false,
        showLife: false,
        showDamage: false,
        showThreat: false,
        showGeneric: false,
        highlightPlayable: true,
        rotatePlanCards: false,
        showExhausted: false,
    });
    const template = list.renderCard({
        name: 'Example card',
        image: 'example-card',
        playable,
    }, 0);

    return template.values[0];
};

test('highlights only explicitly playable cards', () => {
    assert.equal(renderCardClass(true), 'playable');
    assert.equal(renderCardClass(false), '');
    assert.equal(renderCardClass(undefined), '');
});

test('does not highlight a card while it is temporarily disabled', () => {
    assert.equal(renderCardClass(true, [0]), 'disabled');
});

test('applies a diffuse yellow highlight only to the card image', () => {
    const styles = CardComponent.styles.cssText;

    assert.match(
        styles,
        /:host\(\.playable\) \.card-face > mc-card-image/
    );
    assert.match(styles, /drop-shadow\(0 0 4px rgba\(255, 235, 59, 0\.95\)\)/);
    assert.doesNotMatch(styles, /:host\(\.playable\).*outline/s);
});
