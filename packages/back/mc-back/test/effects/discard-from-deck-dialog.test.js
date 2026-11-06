import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {DiscardFromDeckEffect} from '../../src/effects/discard-from-deck-effect.js';

describe('DiscardFromDeckEffect dialog', () => {
    test('identifies the source card without unconditional interruption guidance', async () => {
        const cards = [
            {id: 'first', toObj() { return {id: this.id}; }},
            {id: 'second', toObj() { return {id: this.id}; }},
        ];
        const deck = {
            async discardTopCards(count) {
                return cards.splice(0, count);
            },
            refresh() {},
        };
        const dialogs = [];
        const effect = new DiscardFromDeckEffect({count: 2});
        effect.ability = {
            card: {name: 'Descomposición molecular'},
        };
        effect.openDialog = async dialog => dialogs.push(dialog);

        await effect.execute({player: {deck}});

        assert.equal(dialogs.length, 1);
        assert.equal(dialogs[0].title, 'Cartas que se van a descartar');
        assert.match(
            dialogs[0].subtitle,
            /Se descartan por Descomposición molecular\./
        );
        assert.match(
            dialogs[0].subtitle,
            /En el orden en que se descartarán, desde la carta superior\./
        );
        assert.doesNotMatch(dialogs[0].subtitle, /interrumpir/i);
        assert.deepEqual(
            dialogs[0].data.cards.map(({id}) => id),
            ['first', 'second']
        );
    });
});
