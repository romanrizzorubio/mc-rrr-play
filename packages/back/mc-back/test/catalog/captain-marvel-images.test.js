import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {describe, test} from 'node:test';

import captainMarvel from '../../../mc-data/seed/catalog/heroes/captain-marvel.js';

const expectedImages = {
    'Carol Danvers': 'heroes/captain-marvel/01010b.png',
    'Capitana Marvel': 'heroes/captain-marvel/01010a.png',
    'Spider Woman': 'heroes/captain-marvel/01011.png',
    'Evitar una crisis': 'heroes/captain-marvel/01012.png',
    'Rayo fotónico': 'heroes/captain-marvel/01013.png',
    'Absorción de Energía': 'heroes/captain-marvel/01014.png',
    'Base orbital de Alpha Flight': 'heroes/captain-marvel/01015.png',
    'Casco de la Capitana Marvel': 'heroes/captain-marvel/01016.png',
    'Vuelo cósmico': 'heroes/captain-marvel/01017.png',
    'Canalizar energía': 'heroes/captain-marvel/01018.png',
    'Emergencia familiar': 'heroes/captain-marvel/01175.png',
    'El psicomagnetrón': 'heroes/captain-marvel/01176.png',
    'Yon-Rogg': 'heroes/captain-marvel/01177.png',
    'Manipulador kree': 'heroes/captain-marvel/01178.png',
    'La traición de Yon-Rogg': 'heroes/captain-marvel/01179.png',
};

function collectCardImages(value, images = {}) {
    if (Array.isArray(value)) {
        value.forEach(item => collectCardImages(item, images));
        return images;
    }

    if (!value || typeof value !== 'object') {
        return images;
    }

    const params = value.params;
    if (params?.name && params.image) {
        images[params.name] = params.image;
    }

    Object.values(value).forEach(item => collectCardImages(item, images));
    return images;
}

describe('Captain Marvel card images', () => {
    test('maps each card to its matching PNG and keeps every asset available', async () => {
        const images = collectCardImages(captainMarvel.config);

        assert.deepEqual(
            Object.fromEntries(
                Object.keys(expectedImages).map(name => [name, images[name]]),
            ),
            expectedImages,
        );

        await Promise.all(Object.values(expectedImages).map(image =>
            access(new URL(
                `../../../../front/mc-static/src/assets/images/cards/${image}`,
                import.meta.url,
            )),
        ));
    });
});
