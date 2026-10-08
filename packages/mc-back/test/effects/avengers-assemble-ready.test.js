import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_ALL_CHARACTERS_YOU_CONTROL, TRAIT_AVENGER} from 'mc-shared';

import {ReadyEffect} from '../../src/effects/ready-effect.js';
import {Player} from '../../src/model/match/player.js';
import {GameCard} from '../../src/model/cards/game-card.js';
import leadershipEvents from '../../../mc-data/seed/catalog/aspects/leadership/events.js';

test('Avengers Assemble readies each exhausted Avenger the player controls', async () => {
    const avengersAssemble = leadershipEvents.find(({_id}) =>
        _id === 'leadership-avengers-assemble');
    assert.ok(avengersAssemble);

    const [{params: {effect: chainedConfig}}] =
        avengersAssemble.card.params.abilities;
    const [readyConfig] = chainedConfig.params.effects;
    assert.equal(
        readyConfig.params.target,
        TARGET_ALL_CHARACTERS_YOU_CONTROL
    );

    const refreshed = [];
    const makeCharacter = ({id, isAlly, traits}) => {
        const character = new GameCard({
            card: {id, name: id, isAlly, traits},
        });
        character.refresh = async () => refreshed.push(id);

        return character;
    };
    const superhero = makeCharacter({
        id: 'Capitán América',
        traits: [TRAIT_AVENGER],
    });
    const avengerAlly = makeCharacter({
        id: 'Hombre Maravilla',
        isAlly: true,
        traits: [TRAIT_AVENGER],
    });
    const readyAvenger = makeCharacter({
        id: 'Chica Ardilla',
        isAlly: true,
        traits: [TRAIT_AVENGER],
    });
    const nonAvenger = makeCharacter({
        id: 'Otro aliado',
        isAlly: true,
        traits: [],
    });
    const player = new Player({name: 'Player', superhero});
    player.gameZone = {cards: [avengerAlly, readyAvenger, nonAvenger]};
    const match = {triggerCards: {}};

    superhero.exhaust();
    avengerAlly.exhaust();
    nonAvenger.exhaust();

    const readyEffect = new ReadyEffect({...readyConfig.params, match});
    await readyEffect.runEffect({player});

    assert.equal(superhero.exhausted, false);
    assert.equal(avengerAlly.exhausted, false);
    assert.equal(readyAvenger.exhausted, false);
    assert.equal(nonAvenger.exhausted, true);
    assert.deepEqual(refreshed.sort(), ['Capitán América', 'Hombre Maravilla']);
});
