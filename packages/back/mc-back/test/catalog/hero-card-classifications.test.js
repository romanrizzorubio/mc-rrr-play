import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {CLASSIFICATION_HERO} from 'mc-shared';
import antMan from '../../../mc-data/seed/catalog/heroes/ant-man.js';
import blackPanther from '../../../mc-data/seed/catalog/heroes/blackpanther.js';
import blackWidow from '../../../mc-data/seed/catalog/heroes/black-widow.js';
import captainAmerica from '../../../mc-data/seed/catalog/heroes/captain-america.js';
import captainMarvel from '../../../mc-data/seed/catalog/heroes/captain-marvel.js';
import doctorStrange from '../../../mc-data/seed/catalog/heroes/doctor-strange.js';
import hawkeye from '../../../mc-data/seed/catalog/heroes/hawkeye.js';
import hulk from '../../../mc-data/seed/catalog/heroes/hulk.js';
import ironMan from '../../../mc-data/seed/catalog/heroes/ironman.js';
import msMarvel from '../../../mc-data/seed/catalog/heroes/ms-marvel.js';
import sheHulk from '../../../mc-data/seed/catalog/heroes/she-hulk.js';
import spiderMan from '../../../mc-data/seed/catalog/heroes/spiderman.js';
import spiderWoman from '../../../mc-data/seed/catalog/heroes/spiderwoman.js';
import thor from '../../../mc-data/seed/catalog/heroes/thor.js';

const heroes = [
    ['Ant-Man', antMan],
    ['Pantera Negra', blackPanther],
    ['Viuda Negra', blackWidow],
    ['Capitán América', captainAmerica],
    ['Capitana Marvel', captainMarvel],
    ['Doctor Strange', doctorStrange],
    ['Ojo de Halcón', hawkeye],
    ['Hulk', hulk],
    ['Iron Man', ironMan],
    ['Ms. Marvel', msMarvel],
    ['Hulka', sheHulk],
    ['Spider-Man', spiderMan],
    ['Spider-Woman', spiderWoman],
    ['Thor', thor],
];

describe('hero card classifications', () => {
    test('every fixed hero card has the hero classification', () => {
        for (const [heroName, hero] of heroes) {
            for (const {card} of hero.config.cards) {
                const classification = card.params.classification;
                const classifications = Array.isArray(classification) ?
                    classification :
                    [classification];

                assert.ok(
                    classifications.includes(CLASSIFICATION_HERO),
                    `${heroName}: ${card.params.name}`,
                );
            }
        }
    });

    test('keeps Captain Marvel as the card set, not an extra classification', () => {
        const energyAbsorption = captainMarvel.config.cards.find(({card}) =>
            card.params.name === 'Absorción de Energía').card;

        assert.equal(energyAbsorption.params.set, 'Captain Marvel');
        assert.equal(energyAbsorption.params.classification, CLASSIFICATION_HERO);
    });
});
