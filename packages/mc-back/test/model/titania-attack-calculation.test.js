import assert from 'node:assert/strict';
import {test} from 'node:test';

import sheHulk from '../../../mc-data/seed/catalog/heroes/she-hulk.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

test('Titania displays attack equal to her remaining hit points', () => {
    const match = {
        triggerCards: {},
    };
    const cardsFactory = new CardsFactory({match});
    const titaniaConfig = sheHulk.config.nemesis.find(({card}) =>
        card.params.name === 'Titania').card;
    const titania = cardsFactory.createGameCard({
        card: cardsFactory.createCard(titaniaConfig),
    });

    titania.damage = 4;

    assert.equal(titania.attack, 2);
    assert.equal(titania.toObj().attack, 2);
});
