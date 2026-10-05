import assert from 'node:assert/strict';
import {test} from 'node:test';

import {ABILITY_WHEN_REVEALED_HERO, TARGET_ATTACKED, TARGET_YOUR_HERO} from 'mc-shared';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {DoIfTakeCharacterDamageEffect} from '../../src/effects/do-if-take-character-damage-effect.js';
import {StunEffect} from '../../src/effects/stun-effect.js';

test('damage condition resolves its configured source before validating its target', async () => {
    const target = {
        isInPlay: true,
        isStunned: false,
        refresh() {},
        stun() {
            this.isStunned = true;
        },
    };
    const attack = {
        selectedTarget: target,
    };
    attack.activation = {
        effect: attack,
        takenDamage: 3,
    };
    const match = {
        triggerCards: {},
    };
    const effect = new DoIfTakeCharacterDamageEffect({
        effect: new StunEffect({
            match,
            target: TARGET_ATTACKED,
        }),
        match,
        source: 'effects.0',
    });
    const params = {
        effects: [attack],
        match,
        player: {},
    };

    assert.equal(await effect.canRun(params), true);
    await effect.runEffect(params);

    assert.equal(target.isStunned, true);
});

test('player is not stunned when an ally defending an attack takes the damage', async () => {
    const player = {
        isHero: true,
        isPlayer: true,
        superhero: {currentSide: {isHero: true, isStunned: false, refresh() {}, stun() {
            this.isStunned = true;
        }}},
    };
    const ally = {isAlly: true};
    const attack = {
        attacked: ally,
        selectedTarget: player,
    };
    attack.activation = {
        effect: attack,
        takenDamage: 3,
    };
    const match = {
        triggerCards: {},
    };
    const effect = new DoIfTakeCharacterDamageEffect({
        effect: new StunEffect({
            match,
            target: TARGET_YOUR_HERO,
        }),
        match,
        source: 'effects.0',
        target: TARGET_YOUR_HERO,
    });

    await effect.runEffect({
        effects: [attack],
        match,
        player,
    });

    assert.equal(player.superhero.currentSide.isStunned, false);
});

test('player is stunned when the attack deals damage to their hero', async () => {
    const hero = {
        isHero: true,
        isStunned: false,
        refresh() {},
        stun() {
            this.isStunned = true;
        },
    };
    const player = {
        isHero: true,
        isPlayer: true,
        superhero: {currentSide: hero},
    };
    const attack = {
        attacked: hero,
        selectedTarget: player,
    };
    attack.activation = {
        effect: attack,
        takenDamage: 1,
    };
    const match = {
        triggerCards: {},
    };
    const effect = new DoIfTakeCharacterDamageEffect({
        effect: new StunEffect({
            match,
            target: TARGET_YOUR_HERO,
        }),
        match,
        source: 'effects.0',
        target: TARGET_YOUR_HERO,
    });

    await effect.runEffect({
        effects: [attack],
        match,
        player,
    });

    assert.equal(hero.isStunned, true);
});

test('player damage from overkill counts, but damage prevented from them does not', () => {
    const hero = {isHero: true, isStunned: false, refresh() {}, stun() {}};
    const player = {
        isHero: true,
        isPlayer: true,
        superhero: {currentSide: hero},
    };
    const ally = {isAlly: true};
    const attack = {
        activation: {
            attackedTargets: [ally, player],
            effect: {attacked: ally},
            takenDamage: [3, 0],
        },
    };
    const effect = new DoIfTakeCharacterDamageEffect({
        match: {},
        target: TARGET_YOUR_HERO,
    });
    effect.selectedTarget = attack;

    assert.equal(effect.checkCondition({player}), false);

    attack.activation.takenDamage[1] = 1;

    assert.equal(effect.checkCondition({player}), true);
});

test('array damage amounts trigger the condition only if at least one target takes damage', () => {
    const attack = {
        activation: {
            effect: {},
            takenDamage: [0, 0],
        },
    };
    const effect = new DoIfTakeCharacterDamageEffect({match: {}});
    effect.selectedTarget = attack;

    assert.equal(effect.checkCondition(), false);
});

test('Estampida limits its stun condition to damage suffered by the player', async () => {
    const {scenarios} = await loadCatalog();
    const rhino = scenarios.find(({_id}) => _id === 'rhino');
    const estampida = rhino.config.cards.find(({card}) =>
        card.params.name === 'Estampida');
    const heroReveal = estampida.card.params.abilities.find(({type}) =>
        type === ABILITY_WHEN_REVEALED_HERO);
    const [, damageCondition] = heroReveal.params.effect.params.effects;
    const {effect: stunEffect} = damageCondition.params;

    assert.equal(damageCondition.params.target, TARGET_YOUR_HERO);
    assert.equal(stunEffect.params.target, TARGET_YOUR_HERO);
});
