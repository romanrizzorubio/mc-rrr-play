import assert from 'node:assert/strict';
import {test} from 'node:test';

import {Match} from '../../src/model/match/match.js';
import {Player} from '../../src/model/match/player.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';
import {Scenario} from '../../src/model/match/scenario.js';
import {ScenarioZone} from '../../src/model/match/scenario-zone.js';

const iconCard = ({
    accelerationIcons = 0,
    hazardIcons = 0,
    hasCrisis = false,
    amplificationIcons = 0,
} = {}) => ({
    accelerationIcons,
    hazardIcons,
    hasCrisis,
    amplificationIcons,
    accelerationTokens: 0,
    endTriggers() {},
});

test('match resolves icons from every in-play zone and the current scheme, villain, and hero', () => {
    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'in-play-icons-test',
    });
    const scenario = new Scenario({
        mainSchemes: [],
        match,
        name: 'icons-test',
        scenarioCards: [],
        sets: [],
        villains: [],
    });
    const scenarioZone = new ScenarioZone({owner: scenario});
    const sideScheme = iconCard({
        accelerationIcons: 1,
        hazardIcons: 2,
        amplificationIcons: 1,
    });
    const mainScheme = iconCard({
        accelerationIcons: 2,
        hazardIcons: 1,
        amplificationIcons: 2,
    });
    const villain = iconCard({
        accelerationIcons: 3,
        hazardIcons: 1,
        hasCrisis: true,
        amplificationIcons: 3,
    });
    scenarioZone.cards.push(sideScheme, mainScheme, villain);
    scenarioZone.currentScheme = mainScheme;
    scenarioZone.currentVillain = villain;
    scenario.gameZone = scenarioZone;
    match.scenario = scenario;

    const player = new Player({
        name: 'Icon tester',
        superhero: iconCard({
            accelerationIcons: 6,
            hazardIcons: 4,
            hasCrisis: true,
            amplificationIcons: 2,
        }),
    });
    const playerZone = new PlayerZone({owner: player});
    playerZone.cards.push(iconCard({
        accelerationIcons: 4,
        hazardIcons: 2,
        amplificationIcons: 1,
    }));
    playerZone.engage(iconCard({
        accelerationIcons: 5,
        hazardIcons: 3,
        amplificationIcons: 1,
    }));
    player.gameZone = playerZone;
    match.players = [player];

    assert.equal(scenarioZone.accelerationIcons, 6);
    assert.equal(scenarioZone.hazardIcons, 4);
    assert.equal(scenarioZone.hasCrisis, true);
    assert.equal(scenarioZone.amplificationIcons, 6);
    assert.equal(playerZone.accelerationIcons, 9);
    assert.equal(playerZone.hazardIcons, 5);
    assert.equal(playerZone.amplificationIcons, 2);
    assert.equal(match.accelerationIcons, 21);
    assert.equal(match.hazardIcons, 13);
    assert.equal(match.hasCrisis, true);
    assert.equal(match.amplificationIcons, 10);

    scenarioZone.remove(sideScheme);
    assert.equal(scenarioZone.hazardIcons, 2);
    assert.equal(match.hazardIcons, 11);
    playerZone.removeEngaged(playerZone.minions[0]);
    assert.equal(match.accelerationIcons, 15);
    assert.equal(match.hazardIcons, 8);
    assert.equal(match.amplificationIcons, 8);

    villain.hasCrisis = false;
    assert.equal(scenarioZone.hasCrisis, false);
    assert.equal(match.hasCrisis, true);
});
