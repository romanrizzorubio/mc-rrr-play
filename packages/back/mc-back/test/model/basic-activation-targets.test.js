import assert from 'node:assert/strict';
import {test} from 'node:test';

import {Effect} from '../../src/effects/effect.js';
import {Player} from '../../src/model/match/player.js';

function createAbility({
    isAttack = false,
    isThwart = false,
    targets = [],
    disabled = false,
}) {
    return {
        isAction: false,
        isAttack,
        isBasic: true,
        isThwart,
        name: isAttack ? 'Ataque' : 'Intervención',
        effect: {
            selectedTarget: undefined,
            async getValidTarget() {
                return targets;
            },
        },
        prepareEffect() {
            this.effect.selectedTarget = undefined;
        },
        async canRun() {
            return !disabled;
        },
        toObj() {
            return {
                isAction: this.isAction,
                isAttack: this.isAttack,
                isBasic: this.isBasic,
                isResource: false,
                isThwart: this.isThwart,
                name: this.name,
            };
        },
    };
}

function createPlayablePlayer(abilities) {
    const player = Object.create(Player.prototype);
    player.name = 'Player';
    player.canFlip = async () => false;
    player.getHandSize = async () => 5;
    player.hand = {toObjWithPlayability: async () => []};
    player.toObj = () => ({
        superhero: {
            extraTraits: [],
        },
    });
    player.superhero = {
        attached: [],
        currentSide: {
            abilities,
            traits: [],
        },
        getEffectiveStats: async () => ({}),
        getEffectiveTraits: async () => [],
    };

    return player;
}

test('player snapshot includes only legal target ids for each usable basic activation', async () => {
    const villain = {id: 'villain-1'};
    const scheme = {id: 'scheme-1'};
    const attack = createAbility({
        isAttack: true,
        targets: [villain],
    });
    const thwart = createAbility({
        isThwart: true,
        targets: [scheme],
        disabled: true,
    });
    const player = createPlayablePlayer([attack, thwart]);

    const snapshot = await player.toObjWithPlayableHand();

    assert.deepEqual(
        snapshot.superhero.abilities.map(({availableTargetIds}) => availableTargetIds),
        [['villain-1'], undefined]
    );
    assert.equal(snapshot.superhero.abilities[1].disable, true);
});

test('resolving a basic activation keeps the chosen target and rejects an invalid target', async () => {
    const target = {id: 'villain-1'};
    const ability = createAbility({
        isAttack: true,
        targets: [target],
    });
    let resolution;
    const hero = {
        id: 'hero-1',
        currentSide: {abilities: [ability]},
        async resolveAbility(params) {
            resolution = params;
        },
    };
    const player = Object.create(Player.prototype);
    player.superhero = hero;
    player.getCard = cardId => cardId === hero.id ? hero : undefined;
    const match = {
        scenario: {
            getCard: () => undefined,
        },
    };
    hero.match = match;

    await player.resolveAbility(hero.id, 0, target.id);

    assert.equal(resolution.preselectedTarget, true);
    assert.equal(resolution.selectedTarget, target);
    assert.equal(ability.effect.selectedTarget, target);
    await assert.rejects(
        player.resolveAbility(hero.id, 0, 'invalid-target'),
        /objetivo de la activación ya no es válido/
    );
});

test('fixed preselected targets are revalidated without opening a second target selection', () => {
    const target = {id: 'scheme-1'};
    let selectionOpened = false;
    const effect = Object.assign(Object.create(Effect.prototype), {
        _selectedTarget: target,
        ability: undefined,
        refreshTarget: true,
        source: undefined,
        target: 'scheme',
        validTarget: {
            filter(candidate) {
                return candidate === target;
            },
            selectTarget() {
                selectionOpened = true;
                return null;
            },
        },
    });

    assert.equal(effect.selectTarget({fixedPreselectedTarget: true}), target);
    assert.equal(selectionOpened, false);

    effect.validTarget.filter = () => false;
    assert.equal(effect.selectTarget({fixedPreselectedTarget: true}), null);
});
