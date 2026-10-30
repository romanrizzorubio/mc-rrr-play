import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {describe, test} from 'node:test';

globalThis.HTMLElement ??= class {};
globalThis.window ??= {};
globalThis.window.customElements ??= {define() {}};
globalThis.CustomEvent ??= class {
    constructor(type, options = {}) {
        this.type = type;
        Object.assign(this, options);
    }
};

const {McHand} = await import('../src/components/panels/mc-hand/mc-hand.js');
const styles = await readFile(
    new URL('../src/components/panels/mc-hand/mc-hand.css.js', import.meta.url),
    'utf8',
);

describe('hand panel controls', () => {
    test('allows closing and reopening the hand while waiting for another player', () => {
        const hand = Object.assign(Object.create(McHand.prototype), {
            showPanel: true,
            interactive: false,
        });
        let stops = 0;
        const event = {stopPropagation: () => stops++};
        hand.handleToggle(event);
        assert.equal(hand.showPanel, false);
        assert.equal(hand.getClass(), 'hide');
        assert.equal(hand.getButton(), '^');
        hand.handleToggle(event);
        assert.equal(hand.showPanel, true);
        assert.equal(hand.getClass(), 'show');
        assert.equal(hand.getButton(), 'v');
        assert.equal(stops, 2);
    });

    test('blocks card selection but not the toggle while inactive or paying', () => {
        const dispatched = [];
        const hand = Object.assign(Object.create(McHand.prototype), {
            cards: [{id: 'card'}],
            interactive: false,
            playCardPending: false,
            showPanel: true,
            dispatchEvent: event => dispatched.push(event),
        });
        const selection = {detail: {card: hand.cards[0], cardIndex: 0}};
        hand.handleSelect(selection);
        assert.equal(dispatched.length, 0);

        let template = hand.render();
        const disabledIndex = template.strings.findIndex(part =>
            part.includes('.disabledCards="'));
        const inertIndex = template.strings.findIndex(part =>
            part.includes('?inert="'));
        const toggleIndex = template.strings.findIndex(part =>
            part.includes('aria-expanded="'));
        assert.deepEqual(template.values[disabledIndex], [0]);
        assert.equal(template.values[inertIndex], true);
        assert.equal(template.values[toggleIndex], true);
        assert.doesNotMatch(template.strings.join(''), /\?disabled=/u);

        hand.interactive = true;
        hand.playCardPending = true;
        hand.handleSelect(selection);
        assert.equal(dispatched.length, 0);
        hand.playCardPending = false;
        hand.handleSelect(selection);
        assert.equal(dispatched[0].type, 'hand-select-card');
        template = hand.render();
        assert.equal(template.values[inertIndex], false);
        assert.deepEqual(template.values[disabledIndex], []);
    });

    test('keeps the collapsed toggle on screen and stacks the hand above board buttons', () => {
        assert.match(styles,
            /:host\s*\{[^}]*position:\s*fixed;[^}]*inset:\s*auto 0 0;[^}]*z-index:\s*20;/su);
        assert.match(styles, /\.panel.hide mc-card-list\s*\{[^}]*display:\s*none;/su);
        assert.doesNotMatch(styles, /bottom:\s*-\d/u);
        assert.match(styles, /mc-card-list\[inert\]\s*\{[^}]*pointer-events:\s*none;/su);
    });
});
