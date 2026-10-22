import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    PLACE_ASIDE_MATCH,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    PLACE_OUTSIDE_NEMESIS,
} from 'mc-shared';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};

const {McSelectPlacesDialog} = await import(
    '../src/components/dialog/mc-select-places-dialog/mc-select-places-dialog.js'
);

describe('McSelectPlacesDialog', () => {
    test('renders localized labels for searchable card locations', () => {
        const dialog = Object.create(McSelectPlacesDialog.prototype);
        dialog.data = {
            places: {
                [PLACE_ASIDE_MATCH]: [],
                [PLACE_ENCOUNTER_DECK_CARDS]: [],
                [PLACE_ENCOUNTER_DISCARD]: [],
                [PLACE_OUTSIDE_NEMESIS]: [],
            },
        };
        const expectedNames = new Map([
            [PLACE_ASIDE_MATCH, 'Cartas apartadas del escenario'],
            [PLACE_ENCOUNTER_DECK_CARDS, 'Mazo de Encuentros'],
            [PLACE_ENCOUNTER_DISCARD, 'Descarte de Encuentros'],
            [PLACE_OUTSIDE_NEMESIS, 'Cartas de archienemigo apartadas'],
        ]);

        for (const [place, expectedName] of expectedNames) {
            const template = dialog._renderPlace(place);

            assert.equal(template.values[0], expectedName);
        }
    });
});
