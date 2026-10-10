import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_YOUR_HERO} from 'mc-shared';

import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {ReadyEffect} from '../../src/effects/ready-effect.js';
import {Player} from '../../src/model/match/player.js';
import {GameCard} from '../../src/model/cards/game-card.js';
import protectionUpgrades from '../../../mc-data/seed/catalog/aspects/protection/upgrades.js';

test('Indomitable readies both hero sides so it can defend a later attack', async () => {
    const indomitable = protectionUpgrades.find(({_id}) =>
        _id === 'protection-indomito');
    assert.ok(indomitable);

    const [{params: {effect: readyConfig}}] = indomitable.card.params.abilities;
    assert.equal(readyConfig.params.target, TARGET_YOUR_HERO);
    const heroSide = new GameCard({card: {id: 'hero-side', isHero: true}});
    const alterEgoSide = new GameCard({
        card: {id: 'alter-ego-side', isAlterEgo: true},
    });
    const superhero = new GameCard({
        card: {id: 'superhero'},
        sides: [heroSide, alterEgoSide],
    });
    heroSide.refresh = async () => {};
    const player = new Player({name: 'Player', superhero});
    player.gameZone = {cards: []};

    heroSide.exhaust();
    assert.equal(superhero.exhausted, true);
    assert.equal(alterEgoSide.exhausted, true);

    const match = {triggerCards: {}};
    const readyEffect = new ReadyEffect({...readyConfig.params, match});
    await readyEffect.runEffect({player});

    assert.equal(superhero.exhausted, false);
    assert.equal(heroSide.exhausted, false);
    assert.equal(alterEgoSide.exhausted, false);

    const nextAttack = new EnemyAttackEffect({enemy: {}, match});
    nextAttack.selectedTarget = player;

    assert.deepEqual(nextAttack.getDefenders(), [superhero]);
});
