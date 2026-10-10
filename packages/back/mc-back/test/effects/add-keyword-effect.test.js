import assert from 'node:assert/strict';
import test from 'node:test';

import {
    EFFECT_ADD_KEYWORD,
    TARGET_ALL_CHARACTERS,
    TARGET_YOUR_HERO,
    TRIGGER_CONDITION_GET_DEFENSE,
    TRIGGER_THIS_ENTER_PLAY,
} from 'mc-shared';
import captainAmerica from '../../../mc-data/seed/catalog/heroes/captain-america.js';
import {AddKeywordEffect} from '../../src/effects/add-keyword-effect.js';
import {EFFECT_MAP} from '../../src/factory/effects/effects-map.js';
import {CharacterGameCard} from '../../src/model/cards/character-game-card.js';

function createHero() {
    const hero = Object.create(CharacterGameCard.prototype);

    Object.assign(hero, {
        attached: [],
        abilities: [],
        card: {
            attack: 1,
            defense: 2,
            hitPoints: 10,
            image: 'test.png',
            keywords: {guard: false, piercing: false, retaliate: 0},
            name: 'Test hero',
            recovery: 3,
            retaliate: 0,
            thwart: 1,
            toObj() {
                return {name: this.name, image: this.image};
            },
        },
        damage: 0,
        extraTraits: [],
        faceDown: [],
        id: 'test-hero',
        isCard: true,
        keywordModifiers: [],
        modifyAttack: 0,
        modifyHitPoints: 0,
        modifyThwart: 0,
        sides: [],
        async refresh() {},
    });

    return hero;
}

test('AddKeywordEffect grants a keyword while its source card is in play', async () => {
    const hero = createHero();
    const sourceCard = {isInPlay: true};
    const effect = new AddKeywordEffect({
        ability: {card: sourceCard},
        keyword: {retaliate: 1},
        match: {lasting: []},
        selectedTarget: hero,
        target: TARGET_YOUR_HERO,
    });

    await effect.execute({});
    assert.equal(hero.retaliate, 1);

    sourceCard.isInPlay = false;
    assert.equal(hero.retaliate, 0);
});

test('added Retaliate combines with printed and attached Retaliate values', () => {
    const hero = createHero();
    hero.card.retaliate = 2;
    hero.attached.push({card: {retaliate: 3}});
    hero.addKeywordModifier({isInPlay: true}, {}, {retaliate: 1}, false);

    assert.equal(hero.retaliate, 6);
});

test('character serialization exposes only gained keywords absent from its printed text', () => {
    const hero = createHero();
    const sourceCard = {isInPlay: true};
    hero.card.keywords.guard = true;
    hero.addKeywordModifier(sourceCard, {}, {
        guard: true,
        piercing: true,
        retaliate: 1,
    }, false);

    assert.deepEqual(hero.toObj().extraKeywords, [
        {name: 'piercing', value: true},
        {name: 'retaliate', value: 1},
    ]);

    sourceCard.isInPlay = false;
    assert.deepEqual(hero.toObj().extraKeywords, []);
});

test('superhero keywords remain displayed on both sides of its identity', () => {
    const hero = createHero();
    const currentSide = {
        card: {
            keywords: {retaliate: 0},
        },
        isAlterEgo: true,
        getKeyword: name => currentSide.card.keywords[name],
    };
    hero.sides = [currentSide];
    hero.selectedSide = 0;
    hero.addKeywordModifier(
        {isInPlay: true},
        {},
        {retaliate: 1},
        false
    );

    assert.deepEqual(hero.extraKeywords, [{name: 'retaliate', value: 1}]);

    currentSide.isAlterEgo = false;
    assert.deepEqual(hero.extraKeywords, [{name: 'retaliate', value: 1}]);
});

test('a lasting AddKeywordEffect stops granting its keyword when it expires', async () => {
    const hero = createHero();
    const lasting = {match: {lasting: []}};
    lasting.match.lasting.push(lasting);
    const effect = new AddKeywordEffect({
        ability: {card: {isInPlay: false}},
        keyword: {retaliate: 1},
        match: lasting.match,
        selectedTarget: hero,
        target: TARGET_YOUR_HERO,
    });

    await effect.execute({lasting});
    assert.equal(hero.retaliate, 1);

    lasting.match.lasting = [];
    assert.equal(hero.retaliate, 0);
});

test('Captain America Shield stays in the player area and grants its abilities to Captain America', () => {
    const shield = captainAmerica.config.cards.find(({card}) =>
        card.params.name === 'Escudo del Capitán América').card.params;
    const keywordAbility = shield.abilities.find(({params}) =>
        params.effect?.type === EFFECT_ADD_KEYWORD);
    const defenseAbility = shield.abilities.find(({params}) =>
        params.trigger === TRIGGER_CONDITION_GET_DEFENSE);

    assert.equal(shield.attach, undefined);
    assert.deepEqual(shield.keywords, {restricted: true});
    assert.equal(keywordAbility.params.trigger, TRIGGER_THIS_ENTER_PLAY);
    assert.equal(
        keywordAbility.params.effect.params.target,
        TARGET_ALL_CHARACTERS
    );
    assert.deepEqual(keywordAbility.params.effect.params.condition, {
        name: 'Capitán América',
    });
    assert.deepEqual(keywordAbility.params.effect.params.keyword, {retaliate: 1});
    assert.deepEqual(defenseAbility.params.triggerParams, {
        conditionTrigger: {name: 'Capitán América'},
        conditionSource: 'effect.selectedTarget',
    });
    assert.equal(EFFECT_MAP[EFFECT_ADD_KEYWORD], AddKeywordEffect);
});

test('Captain America Shield grants Retaliate to matching names, not an unrelated player hero', async () => {
    const captainAmerica = createHero();
    captainAmerica.mainName = 'Capitán América';
    const steveRogers = createHero();
    steveRogers.card.name = 'Steve Rogers';
    const captainAmericaSide = createHero();
    captainAmericaSide.card.name = 'Capitán América';
    captainAmerica.sides = [steveRogers, captainAmericaSide];
    captainAmerica.selectedSide = 0;
    const captainAmericaAlly = createHero();
    captainAmericaAlly.card.name = 'Capitán América';
    const otherHero = createHero();
    otherHero.mainName = 'Ms. Marvel';
    const enemyCaptain = createHero();
    enemyCaptain.card.name = 'Capitán América';
    const sourceCard = {isInPlay: true};
    const match = {
        enemies: [enemyCaptain],
        friends: [captainAmerica, captainAmericaAlly, otherHero],
        lasting: [],
        triggerCards: {},
    };
    const effect = new AddKeywordEffect({
        ability: {card: sourceCard},
        condition: {name: 'Capitán América'},
        keyword: {retaliate: 1},
        match,
        target: TARGET_ALL_CHARACTERS,
    });

    await effect.runEffect({match});

    assert.equal(steveRogers.retaliate, 0);
    assert.equal(captainAmericaSide.retaliate, 1);
    assert.equal(captainAmerica.retaliate, 0);
    assert.deepEqual(captainAmerica.extraKeywords, []);
    captainAmerica.selectedSide = 1;
    assert.equal(captainAmerica.retaliate, 1);
    assert.deepEqual(captainAmerica.extraKeywords, [
        {name: 'retaliate', value: 1},
    ]);
    captainAmerica.selectedSide = 0;
    assert.equal(captainAmerica.retaliate, 0);
    assert.deepEqual(captainAmerica.extraKeywords, []);
    assert.equal(captainAmericaAlly.retaliate, 1);
    assert.equal(otherHero.retaliate, 0);
    assert.equal(enemyCaptain.retaliate, 1);
});

test('a named keyword modifier on a superhero applies only to the matching side', () => {
    const captainAmerica = createHero();
    const steveRogers = createHero();
    steveRogers.card.name = 'Steve Rogers';
    const captainAmericaSide = createHero();
    captainAmericaSide.card.name = 'Capitán América';
    captainAmerica.sides = [steveRogers, captainAmericaSide];
    captainAmerica.selectedSide = 0;
    captainAmerica.addKeywordModifier(
        {isInPlay: true},
        {effect: {condition: {name: 'Capitán América'}}},
        {retaliate: 1},
        false
    );

    assert.equal(captainAmerica.retaliate, 0);
    assert.deepEqual(captainAmerica.extraKeywords, []);

    captainAmerica.selectedSide = 1;
    assert.equal(captainAmerica.retaliate, 1);
    assert.deepEqual(captainAmerica.extraKeywords, [
        {name: 'retaliate', value: 1},
    ]);
});
