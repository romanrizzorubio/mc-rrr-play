import assert from 'node:assert/strict';
import {test} from 'node:test';

import {translateAspect} from '../index.js';

test('translates supported aspects to Spanish labels', () => {
    const translations = new Map([
        ['aggression', 'Agresividad'],
        ['basic', 'Básica'],
        ['justice', 'Justicia'],
        ['leadership', 'Liderazgo'],
        ['pool', 'Masacrismo'],
        ['protection', 'Protección'],
    ]);

    translations.forEach((label, aspect) => {
        assert.equal(translateAspect(aspect), label);
    });
});

test('preserves labels for unknown aspects', () => {
    assert.equal(translateAspect('custom aspect'), 'custom aspect');
});
