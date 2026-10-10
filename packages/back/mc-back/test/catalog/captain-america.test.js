import assert from 'node:assert/strict';
import test from 'node:test';

import {
    ABILITY_CONSTANT,
    CALC_COUNT,
    EFFECT_CANNOT,
    EFFECT_FOR_EACH,
    EFFECT_SET_LIFE,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ALL_PLAYERS,
    TARGET_ALTEREGO_SIDE,
    TARGET_ENEMY,
    TARGET_ROUND,
    TARGET_YOUR_SUPERHERO,
    TRAIT_AVENGER,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {CannotEffect} from '../../src/effects/cannot-effect.js';
import {DoIfHasPaidEffect} from '../../src/effects/do-if-has-paid-effect.js';
import {ForEachEffect} from '../../src/effects/for-each-effect.js';
import {SetLifeEffect} from '../../src/effects/set-life-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';

test('Captain America cards compile and all precon references resolve', async () => {
    const catalog = await loadCatalog();
    const captainAmerica = catalog.heroes.find(hero => hero._id === 'captain-america');
    assert.ok(captainAmerica);

    const captainHydraSoldier = captainAmerica.config.nemesis.find(({card}) =>
        card.params.name === 'Soldado de Hydra');
    const legionsOfHydra = catalog.sets.find(set => set._id === 'legions-of-hydra');
    const legionsHydraSoldier = legionsOfHydra.config.cards.find(({card}) =>
        card.params.name === 'Soldado de Hydra');

    assert.equal(captainHydraSoldier.count, 2);
    assert.equal(legionsHydraSoldier.count, 3);
    assert.deepEqual(captainHydraSoldier.card, legionsHydraSoldier.card);

    const matchFactory = new MatchFactory({
        triggerCards: {},
    });
    const cardsFactory = matchFactory.cardsFactory;

    const obligationCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(captainAmerica.config.obligation.card),
        owner: {},
    });
    const identityObligationAbility = obligationCard.abilities.find(ability =>
        ability.name === 'Adoptar la identidad de alter ego');

    assert.ok(identityObligationAbility);
    assert.equal(
        identityObligationAbility.effect.effect.formTarget,
        TARGET_ALTEREGO_SIDE
    );
    const identityFlipEffect = identityObligationAbility.effect.effect;
    const superhero = cardsFactory.createCardSides(
        cardsFactory.createSides(captainAmerica.config.sides)
    );
    superhero.selectedSide = superhero.sides.findIndex(side => side.isHero);
    identityFlipEffect.selectedTarget = superhero;
    await identityFlipEffect.prepare({
        match: matchFactory.match,
        player: {},
    });
    assert.equal(
        identityFlipEffect.selectedFormTarget,
        superhero.sides.find(side => side.isAlterEgo)
    );

    const deathSquad = captainAmerica.config.nemesis.find(({card}) =>
        card.params.name === 'Escuadrón de la muerte');
    const deathSquadCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(deathSquad.card),
        owner: {},
    });
    const [deathSquadAbility] = deathSquadCard.abilities;

    assert.ok(deathSquadAbility.effect instanceof ForEachEffect);
    assert.equal(deathSquadAbility.effect.effectType, EFFECT_FOR_EACH);
    assert.equal(deathSquadAbility.effect.target, TARGET_ALL_PLAYERS);

    const hailHydra = captainAmerica.config.nemesis.find(({card}) =>
        card.params.name === '¡Hail Hydra!');
    const hailHydraCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(hailHydra.card),
        owner: {},
    });
    const [hailHydraAbility] = hailHydraCard.abilities;
    const [, hailHydraForEach] = hailHydraAbility.effect.effects;

    assert.ok(hailHydraForEach instanceof ForEachEffect);
    assert.equal(hailHydraForEach.target, TARGET_ALL_PLAYERS);
    assert.deepEqual(hailHydraForEach.condition, {
        exclude: [
            'effects.0.attacks.*.selectedTarget',
            'effects.0.attacks.*.defender.owner',
        ],
    });

    const zemo = captainAmerica.config.nemesis.find(({card}) =>
        card.params.name === 'Barón Zemo');
    const zemoCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(zemo.card),
        owner: {},
    });
    const zemoAbility = zemoCard.abilities.find(({effect}) =>
        effect instanceof CannotEffect);

    assert.ok(zemoAbility);
    assert.equal(zemoAbility.effect.effectType, EFFECT_CANNOT);
    assert.equal(zemoAbility.effect.restriction, 'thwart');
    assert.equal(zemoAbility.effect.sourceIn, 'player.minions');

    const heroicStrike = captainAmerica.config.cards.find(({card}) =>
        card.params.name === 'Golpe heroico');
    const heroicStrikeCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(heroicStrike.card),
        owner: {},
    });
    const [heroicStrikeAbility] = heroicStrikeCard.abilities;
    const heroicStrikeEffect = heroicStrikeAbility.effect;
    const [dealDamage, stunIfPaid] = heroicStrikeEffect.effects;

    assert.ok(heroicStrikeEffect instanceof ChainedEffect);
    assert.ok(stunIfPaid instanceof DoIfHasPaidEffect);
    assert.equal(heroicStrikeEffect.target, TARGET_ENEMY);
    assert.equal(stunIfPaid.target, TARGET_ENEMY);
    assert.equal(stunIfPaid.effect.target, TARGET_ENEMY);
    assert.deepEqual(stunIfPaid.resources, [RESOURCE_PHYSICAL]);
    assert.equal(stunIfPaid.checkCondition({
        playCardEffect: {resourcesPaid: [RESOURCE_MENTAL]},
    }), false);
    assert.equal(stunIfPaid.checkCondition({
        playCardEffect: {resourcesPaid: [RESOURCE_MENTAL, RESOURCE_PHYSICAL]},
    }), true);

    const noEnemyMatch = {
        enemies: [],
        activationsFactory: {
            createActivation: () => ({
                async canRun() {
                    return false;
                },
            }),
        },
    };
    for (const effect of [
        heroicStrikeEffect,
        dealDamage,
        stunIfPaid,
        stunIfPaid.effect,
    ]) {
        effect.match = noEnemyMatch;
        effect.validTarget.match = noEnemyMatch;
    }
    assert.ok(!await heroicStrikeEffect.canRun({
        match: noEnemyMatch,
        player: {},
    }));

    const selectedEnemy = {id: 'selected-enemy'};
    heroicStrikeEffect.selectedTarget = selectedEnemy;
    await heroicStrikeEffect.prepare({player: {}, match: noEnemyMatch});
    await stunIfPaid.prepare({player: {}, match: noEnemyMatch});
    assert.equal(dealDamage.selectedTarget, selectedEnemy);
    assert.equal(stunIfPaid.selectedTarget, selectedEnemy);
    assert.equal(stunIfPaid.effect.selectedTarget, selectedEnemy);

    const shieldToss = captainAmerica.config.cards.find(({card}) =>
        card.params.name === 'Lanzamiento de escudo');
    const shieldTossCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(shieldToss.card),
        owner: {},
    });
    const [shieldTossAbility] = shieldTossCard.abilities;
    const shieldTossEffect = shieldTossAbility.effect;
    const shieldTossDiscard = shieldTossAbility.arrow.cost.effects[0];

    assert.equal(shieldTossEffect.baseDamage, 4);
    assert.equal(shieldTossDiscard.countFromHand, false);
    assert.deepEqual(shieldTossDiscard.paramsCalc, {
        target: 'player.match.enemies',
        formula: CALC_COUNT,
    });
    const discardLimitParams = await shieldTossDiscard.resolveParams({
        player: {
            match: {
                enemies: [{}, {}],
            },
        },
    });
    assert.equal(discardLimitParams.selectCount, 2);
    assert.deepEqual(shieldTossEffect.targetCountCalc, {
        target: 'effect.ability.arrow.cost.effects.0.cards',
        formula: CALC_COUNT,
    });
    assert.equal(
        shieldTossEffect.validTarget.isMultipleTarget({target: TARGET_ENEMY}),
        true
    );
    const selectShieldTossTarget =
        shieldTossEffect.selectTarget.bind(shieldTossEffect);
    let selectedBeforeCosts = false;
    shieldTossAbility.canRun = async () => true;
    shieldTossEffect.selectTarget = async () => {
        selectedBeforeCosts = true;
    };
    assert.deepEqual(
        await shieldTossAbility.prepareToResolve({player: {}}),
        {canRun: true, preselectedTarget: false}
    );
    assert.equal(selectedBeforeCosts, false);
    shieldTossAbility.arrow.cost.effects[0].cards = [{}, {}];
    await shieldTossEffect.resolveParams({player: {}});
    assert.equal(shieldTossEffect.selectCount, 2);
    const possibleTargets = ['enemy-1', 'enemy-2', 'enemy-3'].map(id => ({
        id,
        toObj: () => ({id}),
    }));
    shieldTossEffect.validTarget.getValidTarget = () => possibleTargets;
    shieldTossEffect.validTarget.openDialog = async ({data}) => {
        assert.equal(data.count, 2);
        assert.equal(data.minCount, 2);
        assert.equal(data.upTo, false);

        return {
            selected: [{id: 'enemy-1'}, {id: 'enemy-3'}],
        };
    };
    assert.deepEqual(
        await selectShieldTossTarget({player: {}}),
        [possibleTargets[0], possibleTargets[2]]
    );

    const helmet = captainAmerica.config.cards.find(({card}) =>
        card.params.name === 'Casco del Capitán América');
    const helmetCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(helmet.card),
        owner: {},
    });
    const [helmetAbility] = helmetCard.abilities;
    const [, setLife] = helmetAbility.effect.effects;

    assert.deepEqual(helmetAbility.condition, {
        'effect.selectedTarget.name': 'Capitán América',
    });
    assert.ok(setLife instanceof SetLifeEffect);
    assert.equal(setLife.effectType, EFFECT_SET_LIFE);
    assert.equal(setLife.target, TARGET_YOUR_SUPERHERO);
    assert.equal(setLife.life, 1);
    helmetAbility.effect.canRun = async () => true;
    assert.equal(await helmetAbility.canRun({
        player: {},
        effect: {selectedTarget: {name: 'Capitán América'}},
    }), true);
    assert.equal(await helmetAbility.canRun({
        player: {},
        effect: {selectedTarget: {name: 'Steve Rogers'}},
    }), false);

    const aspectCardIds = new Set([
        ...captainAmerica.config.precon.flatMap(({cardRefs}) =>
            cardRefs.map(({id}) => id)
        ),
        'aggression-enfurecido',
        'justice-seguimiento',
        'protection-defensa-habil',
        'basic-enhanced-awareness',
    ]);
    const cards = [
        ...captainAmerica.config.sides,
        ...captainAmerica.config.cards.map(({card}) => card),
        captainAmerica.config.obligation.card,
        ...captainAmerica.config.nemesis.map(({card}) => card),
        ...[...aspectCardIds].map(id => {
            const entry = catalog.aspects.find(aspect => aspect._id === id);
            assert.ok(entry, `${id} is missing from the catalog`);

            return entry.card;
        }),
    ];

    for (const cardDefinition of cards) {
        const printedCard = cardsFactory.createCard(cardDefinition);
        const gameCard = cardsFactory.createGameCard({
            card: printedCard,
            owner: {},
        });
        const abilities = gameCard.abilities.concat(
            gameCard.boostAbility ? [gameCard.boostAbility] : []
        );

        for (const ability of abilities) {
            if (ability.effect) {
                assert.equal(typeof ability.effect.canRun, 'function', ability.card.name);
            }
        }
    }

    const avengersAssemble = catalog.aspects.find(aspect =>
        aspect._id === 'leadership-avengers-assemble');
    assert.ok(avengersAssemble);
    const avengersAssembleCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(avengersAssemble.card),
        owner: {},
    });
    const [avengersAssembleAbility] = avengersAssembleCard.abilities;
    assert.equal(avengersAssembleAbility.limit, undefined);
    assert.ok(avengersAssembleAbility.maximum);
    assert.equal(avengersAssembleAbility.maximum.count, 1);
    assert.equal(avengersAssembleAbility.maximum.target, TARGET_ROUND);

    const avengersTower = catalog.aspects.find(aspect =>
        aspect._id === 'basic-avengers-tower');
    assert.ok(avengersTower);
    const [towerCapacity] = avengersTower.card.params.abilities;
    assert.equal(towerCapacity.type, ABILITY_CONSTANT);
    assert.deepEqual(towerCapacity.params.condition, {
        'player.allies': {
            'every': {
                'traits': TRAIT_AVENGER
            }
        }
    });
    assert.equal(towerCapacity.params.effect.params.requiredTrait, undefined);

    const towerGameCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(avengersTower.card),
        owner: {},
    });
    const [towerAbility] = towerGameCard.abilities;
    towerAbility.effect.canRun = async () => true;
    assert.equal(await towerAbility.canRun({
        player: {
            allies: [{traits: [TRAIT_AVENGER]}]
        }
    }), true);
    assert.equal(await towerAbility.canRun({
        player: {
            allies: [
                {traits: [TRAIT_AVENGER]},
                {traits: ['Hydra']}
            ]
        }
    }), false);

    const honoraryAvenger = catalog.aspects.find(aspect =>
        aspect._id === 'basic-honorary-avenger');
    assert.ok(honoraryAvenger);
    assert.equal(honoraryAvenger.card.params.maxAttach, 1);
    const honoraryAvengerCard = cardsFactory.createCard(honoraryAvenger.card);
    assert.equal(honoraryAvengerCard.canAttach({
        attached: [{card: {id: honoraryAvengerCard.id}}]
    }), false);

    const aspectIds = new Set(catalog.aspects.map(aspect => aspect._id));
    for (const preconEntry of captainAmerica.config.precon) {
        for (const cardRef of preconEntry.cardRefs) {
            assert.ok(aspectIds.has(cardRef.id), `${cardRef.id} is missing from the catalog`);
        }
    }

});
