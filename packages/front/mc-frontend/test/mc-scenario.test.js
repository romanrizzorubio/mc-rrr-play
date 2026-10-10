import assert from 'node:assert/strict';
import {test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};

const {McScenario} = await import(
    '../src/components/match/mc-scenario/mc-scenario.js'
);
const {McCharacterCard} = await import(
    '../src/components/cards/characters/mc-character-card/mc-character-card.js'
);
const {VillainCardComponent} = await import(
    '../src/components/cards/characters/mc-villain-card/mc-villain-card.js'
);

const assertUnprintedStatsForwarded = (template, unprintedStats) => {
    assert.match(template.strings.join(''), /\.unprintedStats=/);
    assert.ok(template.values.includes(unprintedStats));
};

test('scenario environments render their generic counters', () => {
    const environment = {isEnvironment: true};
    const sideScheme = {isSideScheme: true};
    const template = McScenario.prototype.renderEnvironments.call({
        scenario: {
            gameZone: {
                cards: [environment, sideScheme],
            },
        },
    });

    assert.deepEqual(template.values[0], [environment]);
    assert.match(template.strings.join(''), /show-generic/);
});

test('scenario villains forward unprinted stats to the villain card', () => {
    const unprintedStats = ['attack'];
    const villain = {
        name: 'Norman Osborn',
        image: 'norman-osborn.png',
        life: 14,
        attack: 0,
        scheme: 2,
        unprintedStats,
    };
    const template = McScenario.prototype.renderVillain.call({
        scenario: {villain},
    });

    assertUnprintedStatsForwarded(template, unprintedStats);
});

test('villain card wrappers forward unprinted stats to the card renderer', () => {
    const unprintedStats = ['attack'];
    const villainCard = Object.assign(
        Object.create(VillainCardComponent.prototype),
        {
            name: 'Norman Osborn',
            image: 'norman-osborn.png',
            life: 14,
            hitPoints: 14,
            attack: 0,
            thwart: undefined,
            defense: undefined,
            recovery: undefined,
            scheme: 2,
            unprintedStats,
            stage: 1,
            attached: [],
            faceDown: [],
            statusCards: {},
            extraTraits: [],
            extraKeywords: [],
        }
    );
    const villainTemplate = villainCard.render();
    const characterTemplate = McCharacterCard.prototype.render.call({
        name: 'Norman Osborn',
        image: 'norman-osborn.png',
        isFacedownCard: false,
        life: 14,
        hitPoints: 14,
        attack: 0,
        thwart: undefined,
        defense: undefined,
        recovery: undefined,
        scheme: 2,
        unprintedStats,
        statusCards: {},
        attached: [],
        faceDown: [],
        extraTraits: [],
        extraKeywords: [],
        headerLeft: undefined,
        headerRight: undefined,
        stage: 1,
        nameWithStage: true,
    });

    assertUnprintedStatsForwarded(villainTemplate, unprintedStats);
    assertUnprintedStatsForwarded(characterTemplate, unprintedStats);
});
