import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_SETUP,
    ABILITY_CONSTANT,
    ABILITY_HERO_ACTION,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_VILLAIN,
    EFFECT_CHAINED,
    EFFECT_DEAL_BOOST,
    EFFECT_DISCARD_GAME,
    EFFECT_DELAYED,
    EFFECT_DO_IF_TAKE_DAMAGE,
    EFFECT_EXHAUST,
    EFFECT_MODIFY_HIT_POINTS,
    EFFECT_SEARCH_CARD_REVEAL,
    EFFECT_SPEND,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_THIS,
    TARGET_YOUR_HERO,
    TRAIT_MASTERS_OF_EVIL,
    TRIGGER_CHARACTER_GET_HIT_POINTS,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {DealBoostEffect} from '../../src/effects/deal-boost-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {Match} from '../../src/model/match/match.js';
import {Scenario} from '../../src/model/match/scenario.js';
import {ScenarioZone} from '../../src/model/match/scenario-zone.js';

test('Klaw scenario includes its stages, scheme progression, and encounter cards', async () => {
    const {scenarios} = await loadCatalog();
    const klaw = scenarios.find(({_id}) => _id === 'klaw');

    assert.ok(klaw);
    assert.equal(klaw.name, 'Klaw');
    assert.deepEqual(klaw.config.sets, ['standard']);
    assert.deepEqual(klaw.config.defaultSets, ['masters-of-evil']);
    assert.deepEqual(
        klaw.config.villains.map(({type, params}) => [
            type,
            params.stage,
            params.attack,
            params.scheme,
            params.hitPoints,
            params.traits,
        ]),
        [
            [CARD_TYPE_VILLAIN, 1, 0, 2, [12, true], [TRAIT_MASTERS_OF_EVIL]],
            [CARD_TYPE_VILLAIN, 2, 1, 2, [18, true], [TRAIT_MASTERS_OF_EVIL]],
            [CARD_TYPE_VILLAIN, 3, 2, 3, [22, true], [TRAIT_MASTERS_OF_EVIL]],
        ]
    );

    const [stage1a, stage1b] = klaw.config.mainSchemes[0];
    assert.equal(stage1a.params.abilities[0].type, ABILITY_SETUP);
    assert.equal(
        stage1a.params.abilities[0].params.effect.params.effects[0].type,
        EFFECT_SEARCH_CARD_REVEAL
    );
    assert.deepEqual(stage1b.params.value, [6, true]);
    assert.equal(stage1b.params.final, undefined);
    assert.deepEqual(klaw.config.mainSchemes[1][1].params.value, [8, true]);
    assert.equal(klaw.config.mainSchemes[1][1].params.final, true);

    const cardsByName = new Map(klaw.config.cards.map(entry => [
        entry.card.params.name,
        entry,
    ]));
    assert.equal(cardsByName.get('Guardia acorazado').count, 3);
    assert.equal(cardsByName.get('Traficante de armas').count, 2);
    assert.equal(cardsByName.get('La venganza de Klaw').count, 2);
    assert.equal(cardsByName.get('Estallido sónico').count, 2);
    assert.equal(cardsByName.get('Manipulación del sonido').count, 2);

    const solidSoundBody = cardsByName.get('Cuerpo de sonido sólido').card.params;
    const discardAbility = solidSoundBody.abilities[0];
    assert.equal(discardAbility.type, ABILITY_HERO_ACTION);
    assert.equal(discardAbility.params.arrow.type, EFFECT_SPEND);
    assert.deepEqual(discardAbility.params.arrow.params.resources, [
        RESOURCE_ENERGY,
        RESOURCE_PHYSICAL,
        RESOURCE_MENTAL,
    ]);
    assert.equal(discardAbility.params.effect.type, EFFECT_DISCARD_GAME);
    assert.equal(discardAbility.params.effect.params.target, TARGET_THIS);

    const sonicBoom = cardsByName.get('Estallido sónico').card.params;
    const exhaustAllCharacters = sonicBoom.abilities[0].params.effect.params.options[1];
    assert.equal(exhaustAllCharacters.type, EFFECT_EXHAUST);
    assert.equal(
        exhaustAllCharacters.params.target,
        TARGET_ALL_CHARACTERS_YOU_CONTROL
    );

    const sonicBoomBoost = cardsByName.get('Estallido sónico').card.params.boostAbility;
    const delayedDamageCondition = sonicBoomBoost.params.effect.params.effect;
    assert.equal(sonicBoomBoost.params.effect.type, EFFECT_DELAYED);
    assert.equal(delayedDamageCondition.type, EFFECT_DO_IF_TAKE_DAMAGE);
    assert.equal(delayedDamageCondition.params.target, TARGET_YOUR_HERO);
    assert.equal(
        delayedDamageCondition.params.effect.type,
        EFFECT_EXHAUST
    );

    const immortalScheme = cardsByName.get('Klaw "el inmortal"').card.params;
    assert.equal(immortalScheme.abilities[0].type, ABILITY_CONSTANT);
    assert.equal(
        immortalScheme.abilities[0].params.trigger,
        TRIGGER_CHARACTER_GET_HIT_POINTS
    );
    assert.equal(
        immortalScheme.abilities[0].params.effect.type,
        EFFECT_MODIFY_HIT_POINTS
    );
    assert.equal(
        immortalScheme.abilities[0].params.effect.params.count,
        10
    );
});

test('Klaw Sonic Boom displays text for both When Revealed options', async () => {
    const {scenarios} = await loadCatalog();
    const klaw = scenarios.find(({_id}) => _id === 'klaw');
    const sonicBoom = klaw.config.cards.find(({card}) =>
        card.params.name === 'Estallido sónico').card.params;
    const options = sonicBoom.abilities[0].params.effect.params.options;

    assert.deepEqual(options.map(({params}) => params.title), [
        'Gasta un recurso de cada tipo (Energía, Mental y Físico)',
        'Agota todos los personajes que controlas',
    ]);
});

test('all Klaw card abilities create one effect instance with canRun', async () => {
    const {scenarios} = await loadCatalog();
    const klaw = scenarios.find(({_id}) => _id === 'klaw');
    const cardsFactory = new CardsFactory({match: {}});
    const cardConfigs = [
        ...klaw.config.villains,
        ...klaw.config.mainSchemes.flat(),
        ...klaw.config.cards.map(({card}) => card),
    ];

    for (const cardConfig of cardConfigs) {
        const printedCard = cardsFactory.createCard(cardConfig);
        const gameCard = cardsFactory.createGameCard({
            card: printedCard,
            owner: {},
        });

        for (const ability of gameCard.abilities) {
            if (ability.effect) {
                assert.equal(Array.isArray(ability.effect), false);
                assert.equal(typeof ability.effect.canRun, 'function');
            }
        }

        if (gameCard.boostAbility) {
            assert.equal(typeof gameCard.boostAbility.effect.canRun, 'function');
        }
    }

    const firstVillainInterrupt = klaw.config.villains[0].params.abilities[0];
    assert.equal(
        firstVillainInterrupt.params.effect.type,
        EFFECT_DEAL_BOOST
    );
    const [secondStageWhenRevealed] = klaw.config.villains[1].params.abilities;
    assert.equal(secondStageWhenRevealed.type, ABILITY_WHEN_REVEALED);
    assert.equal(
        secondStageWhenRevealed.params.effect.type,
        EFFECT_CHAINED
    );
    const klawGameCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(klaw.config.villains[1]),
        owner: {},
    });
    assert.ok(klawGameCard.abilities[0].effect instanceof ChainedEffect);
    assert.ok(klawGameCard.abilities[1].effect instanceof DealBoostEffect);
});

test('Klaw el inmortal adds its constant health bonus only while in play', async () => {
    const {scenarios} = await loadCatalog();
    const klaw = scenarios.find(({_id}) => _id === 'klaw');
    const initialPlayer = {name: 'Initial player', isPlayer: true};
    const refreshedCards = [];
    const match = {
        initialPlayer,
        numPlayers: 1,
        triggerCards: {},
        players: [],
        name: 'Klaw test',
        mc: {
            mcSocket: {
                send: (_name, event, card) => refreshedCards.push({event, card}),
            },
        },
    };
    const cardsFactory = new CardsFactory({
        match,
    });
    const villain = cardsFactory.createGameCard({
        card: cardsFactory.createCard(klaw.config.villains[0]),
        owner: {},
    });
    match.villain = villain;
    villain.damage = 5;
    const scenarioOwner = {isPlayer: false, match};
    const scenarioZone = new ScenarioZone({owner: scenarioOwner});
    scenarioOwner.gameZone = scenarioZone;
    scenarioZone.currentVillain = villain;

    const schemeConfig = klaw.config.cards.find(({card}) =>
        card.params.name === 'Klaw "el inmortal"').card;
    const scheme = cardsFactory.createGameCard({
        card: cardsFactory.createCard(schemeConfig),
        owner: {},
    });
    await scheme.initTriggers();

    assert.equal(await villain.getHitPoints(), 22);
    assert.equal(await villain.getLife(), 17);
    await scenarioZone.refresh();
    assert.equal(refreshedCards.at(-1).card.hitPoints, 22);
    assert.equal(refreshedCards.at(-1).card.life, 17);

    const scenario = Object.create(Scenario.prototype);
    scenario.gameZone = scenarioZone;
    scenario.toObj = () => ({villain: villain.toObj()});
    const matchSnapshot = Object.create(Match.prototype);
    const snapshotPlayer = {
        ...initialPlayer,
        initial: true,
        toObjWithPlayableHand: async () => ({}),
    };
    matchSnapshot.players = [snapshotPlayer];
    matchSnapshot.scenario = scenario;
    matchSnapshot.toObj = () => ({scenario: scenario.toObj()});
    const serializedMatch = await matchSnapshot.toObjWithPlayableHands();
    assert.equal(serializedMatch.scenario.villain.hitPoints, 22);
    assert.equal(serializedMatch.scenario.villain.life, 17);

    scheme.endTriggers();

    assert.equal(await villain.getHitPoints(), 12);
    assert.equal(await villain.getLife(), 7);
    await scenarioZone.refresh();
    assert.equal(refreshedCards.at(-1).card.hitPoints, 12);
    assert.equal(refreshedCards.at(-1).card.life, 7);
});
