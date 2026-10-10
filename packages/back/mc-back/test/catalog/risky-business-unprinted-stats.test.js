import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    TARGET_PLAYER_LOWEST_HERO_LIFE,
    TARGET_VILLAIN,
    TARGET_YOU,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {DoIfEffect} from '../../src/effects/do-if-effect.js';
import {SeveralAttacksEffect} from '../../src/effects/several-attacks-effect.js';
import {SurgeEffect} from '../../src/effects/surge-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {Scenario} from '../../src/model/match/scenario.js';
import {ScenarioZone} from '../../src/model/match/scenario-zone.js';

test('Risky Business serializes unprinted villain stats while calculating them as zero', async () => {
    const {scenarios} = await loadCatalog();
    const scenario = scenarios.find(({_id}) => _id === 'risky-business');

    assert.ok(scenario);

    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'risky-business-unprinted-stats-test',
    });
    const factory = new MatchFactory(match);

    for (const villainConfig of scenario.config.villains) {
        const villain = factory.cardsFactory.createGameCardFromConfig(villainConfig);

        for (const [sideIndex, stat] of [[0, 'attack'], [1, 'scheme']]) {
            villain.selectedSide = sideIndex;

            assert.equal(villain[stat], 0);
            assert.deepEqual(villain.toObj().unprintedStats, [stat]);
        }
    }
});

const createMadGeniusReveal = async ({isHero}) => {
    const {scenarios} = await loadCatalog();
    const scenarioData = scenarios.find(({_id}) => _id === 'risky-business');

    assert.ok(scenarioData);

    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: `mad-genius-${isHero ? 'hero' : 'alter-ego'}`,
    });
    const factory = new MatchFactory(match);
    const scenario = new Scenario({
        mainSchemes: [],
        match,
        name: 'mad-genius-test',
        scenarioCards: [],
        sets: [],
        villains: [],
    });
    scenario.gameZone = new ScenarioZone({owner: scenario});
    scenario.gameZone.currentScheme = {
        currentSide: {isMainScheme: true},
    };
    scenario.gameZone.refresh = async () => {};
    match.scenario = scenario;
    match.openDialog = async () => {};
    match.isUniqueCard = () => false;

    const player = {
        initial: true,
        isHero,
        match,
        superhero: {
            life: 8,
            currentSide: {name: isHero ? 'Héroe' : 'Alter ego'},
        },
        hand: {cards: [], async refresh() {}},
        deck: {async discardTopCards() { return []; }, refresh() {}},
        friends: [],
    };
    match.players = [player];

    const villain = factory.cardsFactory.createGameCardFromConfig(
        scenarioData.config.villains[0]
    );
    villain.selectedSide = 1;
    villain.owner = scenario;
    villain.controller = scenario;
    villain.refresh = async () => {};
    scenario.gameZone.currentVillain = villain;
    scenario.gameZone.addToGameZone(villain);

    const madGeniusConfig = scenarioData.config.cards.find(({card}) =>
        card.params.name === 'Genio loco').card;
    const card = factory.cardsFactory.createGameCardFromConfig(madGeniusConfig);
    const ability = card.abilities.find(({isWhenRevealed}) => isWhenRevealed);

    assert.ok(ability);

    return {ability, card, match, player};
};

test('Mad Genius surges when no hero is eligible to be attacked', async () => {
    const {ability, card, player} = await createMadGeniusReveal({isHero: false});
    const [attacks, fallback] = ability.effect.effects;
    const reveal = {surge: false};

    assert.ok(ability.effect instanceof ChainedEffect);
    assert.ok(attacks instanceof SeveralAttacksEffect);
    assert.ok(fallback instanceof DoIfEffect);
    assert.equal(attacks.target, TARGET_YOU);
    assert.equal(attacks.attackTarget, TARGET_PLAYER_LOWEST_HERO_LIFE);
    assert.equal(attacks.enemiesType, TARGET_VILLAIN);
    assert.deepEqual(fallback.condition, {'effects.0.attacks.length': 0});
    assert.ok(fallback.effect instanceof SurgeEffect);

    await ability.resolveAbility({
        card,
        player,
        reveal,
    });

    assert.deepEqual(attacks.attacks, []);
    assert.equal(reveal.surge, true);
});

test('Mad Genius does not surge after the villain attacks an eligible hero', async () => {
    const {ability, card, player} = await createMadGeniusReveal({isHero: true});
    const [attacks] = ability.effect.effects;
    const reveal = {surge: false};
    const resolvedAttacks = [];

    attacks.resolveAttack = async (enemy, target) => {
        resolvedAttacks.push({enemy, target});
        attacks.attacks.push({enemy, selectedTarget: target});
    };

    await ability.resolveAbility({
        card,
        player,
        reveal,
    });

    assert.equal(resolvedAttacks.length, 1);
    assert.equal(resolvedAttacks[0].enemy.name, 'Duende Verde');
    assert.equal(resolvedAttacks[0].target, player);
    assert.equal(reveal.surge, false);
});
