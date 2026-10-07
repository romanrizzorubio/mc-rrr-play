import assert from 'node:assert/strict';
import {test} from 'node:test';

import {CharacterGameCard} from '../../src/model/cards/character-game-card.js';
import {Superhero} from '../../src/model/match/superhero.js';

const match = {
    initialPlayer: {},
    triggerCards: {},
};

const createIdentitySide = (id, {isHero, isAlterEgo}) => new CharacterGameCard({
    card: {
        id,
        name: id,
        isAlterEgo,
        isCharacter: true,
        isFriendFront: false,
        isHero,
        isSuperhero: true,
        hitPoints: 15,
        match,
        quickStrike: false,
    },
});

test('a multi-sided card and all of its faces share damage', () => {
    const heroSide = createIdentitySide('hero', {
        isHero: true,
        isAlterEgo: false,
    });
    const alterEgoSide = createIdentitySide('alter-ego', {
        isHero: false,
        isAlterEgo: true,
    });
    const superhero = new Superhero({
        sides: [heroSide, alterEgoSide],
    });

    superhero.damage = 7;

    assert.equal(heroSide.damage, 7);
    assert.equal(superhero.currentSide.life, 8);

    heroSide.damage = 9;

    assert.equal(superhero.damage, 9);
    assert.equal(alterEgoSide.damage, 9);

    alterEgoSide.placeDamage(1);

    assert.equal(superhero.damage, 10);
    assert.equal(heroSide.life, 5);

    superhero.sides[1].removeDamage(4);

    assert.equal(superhero.damage, 6);
    assert.equal(heroSide.damage, 6);
    assert.equal(alterEgoSide.life, 9);
});
