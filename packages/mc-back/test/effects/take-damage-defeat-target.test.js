import assert from 'node:assert/strict';
import {test} from 'node:test';

import {EFFECT_DEFEAT} from 'mc-shared';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {CharacterGameCard} from '../../src/model/cards/character-game-card.js';

async function defeatActiveSide(name, isAlterEgo) {
    let playerDefeated = false;
    let defeatTarget;
    const player = {
        isPlayer: true,
        async defeat() {
            playerDefeated = true;
        },
    };
    const activeSide = {
        abilities: [],
        confused: 1,
        isAlterEgo,
        isSuperhero: true,
        isVillain: false,
        name,
        owner: player,
        stunned: 1,
        tough: 1,
        defeat: CharacterGameCard.prototype.defeat,
    };
    player.superhero = {currentSide: activeSide};

    const match = {
        effectsFactory: {
            createEffect({type, ...params}) {
                assert.equal(type, EFFECT_DEFEAT);
                defeatTarget = params.selectedTarget;

                return new DefeatEffect({
                    ...params,
                    effectType: type,
                    match,
                });
            },
        },
        triggerCards: {},
        villain: undefined,
    };
    const takeDamage = new TakeDamageEffect({match});

    await takeDamage.defeat(player, {player});

    return {activeSide, defeatTarget, playerDefeated};
}

for (const [name, isAlterEgo] of [
    ['Capitán América', false],
    ['Steve Rogers', true],
]) {
    test(`damage defeats ${name} and propagates defeat to its player`, async () => {
        const {activeSide, defeatTarget, playerDefeated} =
            await defeatActiveSide(name, isAlterEgo);

        assert.strictEqual(defeatTarget, activeSide);
        assert.equal(playerDefeated, true);
        assert.equal(activeSide.stunned, 0);
        assert.equal(activeSide.confused, 0);
        assert.equal(activeSide.tough, 0);
    });
}
