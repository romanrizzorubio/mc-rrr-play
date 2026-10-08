import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_ALL_CHARACTERS_YOU_CONTROL, TRAIT_AVENGER} from 'mc-shared';

import {ModifyAttackValueEffect} from '../../src/effects/modify-attack-value-effect.js';
import {ModifyThwartValueEffect} from '../../src/effects/modify-thwart-value-effect.js';
import {CharacterGameCard} from '../../src/model/cards/character-game-card.js';
import {Player} from '../../src/model/match/player.js';
import {Superhero} from '../../src/model/match/superhero.js';
import {Lasting} from '../../src/engine/lasting.js';
import {LastingEffect} from '../../src/effects/lasting-effect.js';
import leadershipEvents from '../../../mc-data/seed/catalog/aspects/leadership/events.js';

test('Avengers Assemble boosts the controlled Avenger hero side and expires cleanly', async () => {
    const avengersAssemble = leadershipEvents.find(({_id}) =>
        _id === 'leadership-avengers-assemble');
    assert.ok(avengersAssemble);

    const [{params: {effect: chainedConfig}}] =
        avengersAssemble.card.params.abilities;
    const [, lastingConfig] = chainedConfig.params.effects;
    const {effect: simultaneousConfig} = lastingConfig.params;
    const [{params: thwartParams}, {params: attackParams}] =
        simultaneousConfig.params.effects;

    assert.equal(
        lastingConfig.params.target,
        TARGET_ALL_CHARACTERS_YOU_CONTROL
    );
    assert.equal(
        simultaneousConfig.params.target,
        TARGET_ALL_CHARACTERS_YOU_CONTROL
    );
    assert.equal(thwartParams.target, TARGET_ALL_CHARACTERS_YOU_CONTROL);
    assert.equal(attackParams.target, TARGET_ALL_CHARACTERS_YOU_CONTROL);

    const match = {triggerCards: {}, lasting: []};
    const makeCharacter = ({id, isHero, isAlterEgo, isAlly, traits, attack, thwart}) => {
        const character = new CharacterGameCard({
            card: {
                id,
                name: id,
                isHero,
                isAlterEgo,
                isAlly,
                isCharacter: true,
                isFriendFront: false,
                isSuperhero: Boolean(isHero || isAlterEgo),
                traits,
                attack,
                thwart,
                hitPoints: 15,
                match,
                quickStrike: false,
            },
        });
        character.refresh = async () => {};

        return character;
    };
    const heroSide = makeCharacter({
        id: 'Capitán América',
        isHero: true,
        traits: [TRAIT_AVENGER],
        attack: 2,
        thwart: 1,
    });
    const alterEgoSide = makeCharacter({
        id: 'Steve Rogers',
        isAlterEgo: true,
        traits: [],
    });
    const superhero = new Superhero({sides: [heroSide, alterEgoSide]});
    const avengerAlly = makeCharacter({
        id: 'Hombre Maravilla',
        isAlly: true,
        traits: [TRAIT_AVENGER],
        attack: 1,
        thwart: 1,
    });
    const nonAvenger = makeCharacter({
        id: 'Otro aliado',
        isAlly: true,
        traits: [],
        attack: 1,
        thwart: 1,
    });
    const player = new Player({name: 'Player', superhero});
    player.gameZone = {cards: [avengerAlly, nonAvenger]};

    const lastingEffect = new LastingEffect({...lastingConfig.params, match});
    const selectedTargets = await lastingEffect.selectTarget({player});
    assert.deepEqual(selectedTargets, [avengerAlly, superhero]);

    const lasting = new Lasting({match, player});
    const modifyThwart = new ModifyThwartValueEffect({
        ...thwartParams,
        match,
        selectedTarget: selectedTargets,
    });
    const modifyAttack = new ModifyAttackValueEffect({
        ...attackParams,
        match,
        selectedTarget: selectedTargets,
    });
    await modifyThwart.runEffect({player, lasting});
    await modifyAttack.runEffect({player, lasting});

    assert.equal(await heroSide.getAttackValue({player}), 3);
    assert.equal(await heroSide.getThwartValue({player}), 2);
    assert.equal(await avengerAlly.getAttackValue({player}), 2);
    assert.equal(await avengerAlly.getThwartValue({player}), 2);
    assert.equal(nonAvenger.attack, 1);
    assert.equal(nonAvenger.thwart, 1);
    assert.ok(lasting.cleanups.some(cleanup =>
        cleanup instanceof ModifyAttackValueEffect &&
        cleanup.selectedTarget === heroSide
    ));
    assert.ok(lasting.cleanups.some(cleanup =>
        cleanup instanceof ModifyThwartValueEffect &&
        cleanup.selectedTarget === heroSide
    ));

    for (const cleanup of lasting.cleanups) {
        await cleanup.runEffect({player, lasting});
    }

    assert.equal(await heroSide.getAttackValue({player}), 2);
    assert.equal(await heroSide.getThwartValue({player}), 1);
});
