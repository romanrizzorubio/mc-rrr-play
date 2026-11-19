import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ACTION,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_HERO_ACTION,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_EVENT,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    DIALOG_DISCARD_HAND,
    DIALOG_USE_CARD,
    PHASE_PLAYERS,
    EFFECT_BLANK_TEXT,
    EFFECT_CATEGORY_THREAT_REMOVAL,
    EFFECT_CANNOT_TARGET,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_CONFUSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DEAL_ENCOUNTER,
    EFFECT_DISCARD_GAME,
    EFFECT_EXHAUST,
    EFFECT_MAY,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_THREAT,
    EFFECT_SELECT_DISCARD_CARD,
    EFFECT_SIMULTANEOUS,
    EFFECT_STUN,
    EFFECT_SURGE,
    RESOURCE_MENTAL,
    TARGET_ALL_ALLIES,
    TARGET_ALL_PLAYERS,
    TARGET_ALL_SUPERHEROES,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_ATTACHED,
    TARGET_CARD,
    TARGET_THIS,
    TARGET_YOU,
    TARGET_SOURCE,
    TARGET_SCHEME,
    TRAIT_ATTACK,
    TRAIT_ELITE,
    TRAIT_OUTLAW,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_VILLAIN_PHASE_START,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import rhino from '../../../mc-data/seed/catalog/scenarios/rhino.js';
import {checkCondition} from '../../src/engine/utils.js';
import {Ability} from '../../src/abilities/core/ability.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {AssignThreatEffect} from '../../src/effects/assign-threat-effect.js';
import {MoveThreatEffect} from '../../src/effects/move-threat-effect.js';
import {RemoveThreatEffect} from '../../src/effects/remove-threat-effect.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';
import {getAbilitiesWithAvailability} from '../../src/utils/ability-availability.js';

const getGamora = async () => {
    const catalog = await loadCatalog();
    const hero = catalog.heroes.find(({_id}) => _id === 'gamora');
    assert.ok(hero);

    return hero;
};

const getNemesisCard = (hero, name) => {
    const entry = hero.config.nemesis.find(({card}) =>
        card.params.name === name);
    assert.ok(entry, `Missing Gamora nemesis card "${name}".`);

    return entry;
};

const createGame = async () => {
    const hero = await getGamora();
    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'gamora-nemesis-runtime-test',
    });
    match.persist = async () => {};
    match.refresh = async () => {};
    match.openDialog = async dialog => {
        if (dialog.dialogType === DIALOG_DISCARD_HAND) {
            return {
                selected: dialog.data.cards.map(({id}) => ({id})),
            };
        }

        return {};
    };

    const matchFactory = new MatchFactory(match);
    const superhero = matchFactory.createSuperhero({
        ...hero.config,
        cards: [],
        precon: [],
    });
    superhero.selectedSide = 1;

    const player = match.createPlayer({
        name: 'Gamora',
        initial: true,
        superhero,
    });
    player.initPlayer();
    player.gameZone = new PlayerZone({owner: player});
    match.currentPlayer = player;
    match.currentTurnPlayer = player;

    const scenarioConfig = structuredClone(rhino.config);
    scenarioConfig.sets = [];
    scenarioConfig.defaultSets = [];
    const scenario = await matchFactory.createScenario(scenarioConfig);
    match.addScenario(scenario);
    await scenario.initScenario([], false);
    scenario.deck.cards = [];

    return {hero, match, matchFactory, player, scenario, superhero};
};

describe('Gamora nemesis set', () => {
    test('registers the Obligation and five nemesis cards', async () => {
        const hero = await getGamora();
        const {obligation, nemesis} = hero.config;

        assert.equal(obligation.count, 1);
        assert.equal(obligation.card.type, CARD_TYPE_OBLIGATION);
        assert.equal(obligation.card.params.name, 'Destino inconcluso');
        assert.equal(obligation.card.params.image, 'heroes/gamora/18024.png');
        assert.equal(obligation.card.params.boost, 2);
        assert.equal(obligation.card.params.giveToOwner, true);

        const sisterRivalry = getNemesisCard(hero, 'Rivalidad entre hermanas');
        assert.equal(sisterRivalry.count, 1);
        assert.equal(sisterRivalry.card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.equal(sisterRivalry.card.params.image, 'heroes/gamora/18025.png');
        assert.equal(sisterRivalry.card.params.startingThreat, 4);
        assert.equal(sisterRivalry.card.params.boost, 3);

        const nebula = getNemesisCard(hero, 'Nébula');
        assert.equal(nebula.count, 1);
        assert.equal(nebula.card.type, CARD_TYPE_MINION);
        assert.equal(nebula.card.params.image, 'heroes/gamora/18026.png');
        assert.equal(nebula.card.params.nemesis, true);
        assert.equal(nebula.card.params.unique, true);
        assert.deepEqual(nebula.card.params.traits, [TRAIT_ELITE, TRAIT_OUTLAW]);
        assert.equal(nebula.card.params.boost, 3);
        assert.deepEqual(nebula.card.params.keywords, {retaliate: 2});

        const attachment = getNemesisCard(hero, 'Contra las cuerdas');
        assert.equal(attachment.count, 1);
        assert.equal(attachment.card.type, CARD_TYPE_ATTACHMENT);
        assert.equal(attachment.card.params.image, 'heroes/gamora/18027.png');
        assert.equal(attachment.card.params.boost, 1);

        const treachery = getNemesisCard(hero, 'Atacada a traición');
        assert.equal(treachery.count, 2);
        assert.equal(treachery.card.type, CARD_TYPE_TREACHERY);
        assert.equal(treachery.card.params.image, 'heroes/gamora/18028.png');
        assert.equal(treachery.card.params.boost, 2);
        assert.equal(nemesis.reduce((count, entry) => count + entry.count, 0), 5);
    });

    test('configures the Obligation choices', async () => {
        const hero = await getGamora();
        const {card} = hero.config.obligation;
        const [adoptAlterEgo, resolveObligation] = card.params.abilities;

        assert.equal(adoptAlterEgo.type, ABILITY_CONSTANT);
        assert.equal(adoptAlterEgo.params.effect.type, EFFECT_MAY);
        assert.equal(
            adoptAlterEgo.params.effect.params.effect.params.formTarget,
            TARGET_ALTEREGO_SIDE
        );
        assert.equal(resolveObligation.params.effect.type, EFFECT_CHOOSE_ABILITY);

        const [exhaustAlterEgo, discardEvents] =
            resolveObligation.params.effect.params.options;
        assert.equal(exhaustAlterEgo.params.arrow.type, EFFECT_EXHAUST);
        assert.equal(exhaustAlterEgo.params.arrow.params.target, TARGET_ALTEREGO);
        assert.deepEqual(exhaustAlterEgo.params.effect, {
            type: EFFECT_REMOVE_CARD,
            params: {target: TARGET_CARD},
        });

        const [discardTwoEvents, discardObligation] =
            discardEvents.params.effect.params.effects;
        assert.equal(discardTwoEvents.type, EFFECT_SELECT_DISCARD_CARD);
        assert.equal(discardTwoEvents.params.target, TARGET_YOU);
        assert.equal(discardTwoEvents.params.count, 2);
        assert.deepEqual(discardTwoEvents.params.filter, {isEvent: true});
        assert.deepEqual(discardObligation, {
            type: EFFECT_DISCARD_GAME,
            params: {target: TARGET_CARD},
        });
    });

    test('restricts threat removal and gives Gamora an encounter card at phase start', async () => {
        const hero = await getGamora();
        const {card} = getNemesisCard(hero, 'Rivalidad entre hermanas');
        const [cannotRemoveThreat, dealEncounter] = card.params.abilities;
        const validation = cannotRemoveThreat.params.validation;

        assert.equal(validation.type, EFFECT_CANNOT_TARGET);
        assert.deepEqual(validation.params, {
            effectCategories: [EFFECT_CATEGORY_THREAT_REMOVAL],
            effectCondition: {
                not: {'effect.ability.actor.mainName': 'Gamora'},
                sourceTarget: {
                    operator: 'eq',
                    path: 'targetCard',
                },
            },
        });
        assert.equal(dealEncounter.type, ABILITY_FORCED_INTERRUPT);
        assert.equal(dealEncounter.params.trigger, TRIGGER_VILLAIN_PHASE_START);
        assert.deepEqual(dealEncounter.params.effect, {
            type: EFFECT_DEAL_ENCOUNTER,
            params: {
                target: TARGET_ALL_PLAYERS,
                condition: {'superhero.mainName': 'Gamora'},
                count: 1,
            },
        });
    });

    test('only Gamora can remove threat from the scheme, while threat can move onto it', async () => {
        const {hero, match, matchFactory, player, scenario, superhero} =
            await createGame();
        const {aspects, heroes} = await loadCatalog();
        const thorEntry = heroes.find(({_id}) => _id === 'thor');
        assert.ok(thorEntry);

        const thorSuperhero = matchFactory.createSuperhero({
            ...thorEntry.config,
            cards: [],
            precon: [],
            nemesis: [],
            obligation: undefined,
        });
        thorSuperhero.selectedSide = 1;
        const thor = match.createPlayer({
            name: 'Thor',
            superhero: thorSuperhero,
        });
        thor.initPlayer();
        thor.gameZone = new PlayerZone({owner: thor});

        const gamoraThwartAbility =
            player.superhero.currentSide.abilities.find(({isBasic, isThwart}) =>
                isBasic && isThwart);
        assert.ok(gamoraThwartAbility);

        const allyEntry = hero.config.cards.find(({card}) =>
            card.params.name === 'Nébula');
        assert.ok(allyEntry);
        const ally = matchFactory.cardsFactory.createGameCardFromConfig(
            allyEntry.card,
            {owner: player}
        );
        ally.controller = player;
        await player.addToGameZone(ally);
        const allyThwartAbility = ally.abilities.find(({isBasic, isThwart}) =>
            isBasic && isThwart);
        assert.ok(allyThwartAbility);

        const supportEntry = aspects.find(({_id}) =>
            _id === 'justice-surveillance-team');
        assert.ok(supportEntry);
        const support = matchFactory.cardsFactory.createGameCardFromConfig(
            supportEntry.card,
            {owner: player}
        );
        support.controller = player;
        await player.addToGameZone(support);
        const supportAction = support.abilities[0];
        assert.ok(supportAction);

        const thorThwartAbility =
            thor.superhero.currentSide.abilities.find(({isBasic, isThwart}) =>
                isBasic && isThwart);
        assert.ok(thorThwartAbility);

        const schemeConfig = getNemesisCard(
            hero,
            'Rivalidad entre hermanas'
        ).card;
        const scheme = matchFactory.cardsFactory.createGameCardFromConfig(
            schemeConfig,
            {owner: scenario}
        );
        await scheme.initScheme();
        scheme.controller = scenario;
        scenario.gameZone.addToGameZone(scheme);

        const otherScheme = matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
            params: {
                name: 'Otro plan secundario',
                set: 'test',
                image: 'test-side-scheme.png',
                startingThreat: 1,
                boost: 0,
            },
        }, {owner: scenario});
        await otherScheme.initScheme();
        otherScheme.controller = scenario;
        scenario.gameZone.addToGameZone(otherScheme);

        const createThreatRemovalEffects = ability => [
            new RemoveThreatEffect({
                ability,
                match,
                target: TARGET_SCHEME,
                threat: 1,
            }),
            new AssignThreatEffect({
                ability,
                match,
                target: TARGET_SCHEME,
                threat: 1,
            }),
            new MoveThreatEffect({
                ability,
                fromTarget: TARGET_SCHEME,
                match,
                target: TARGET_SCHEME,
                threat: 1,
            }),
        ];
        const createPlayerCardAbility = (type, name) =>
            matchFactory.cardsFactory.createGameCardFromConfig({
                type,
                params: {
                    name,
                    set: 'test',
                    image: 'test-player-card.png',
                    cost: 0,
                    resources: type === CARD_TYPE_RESOURCE ?
                        [RESOURCE_MENTAL] : [],
                    abilities: [
                        {
                            type: ABILITY_ACTION,
                            params: {
                                effect: {
                                    type: EFFECT_REMOVE_THREAT,
                                    params: {
                                        target: TARGET_SCHEME,
                                        threat: 1,
                                    },
                                },
                            },
                        },
                    ],
                },
            }, {owner: player}).abilities[0];
        const eventAbility = createPlayerCardAbility(
            CARD_TYPE_EVENT,
            'Evento de prueba'
        );
        const upgradeAbility = createPlayerCardAbility(
            CARD_TYPE_UPGRADE,
            'Mejora de prueba'
        );
        upgradeAbility.card.controller = player;
        const resourceAbility = createPlayerCardAbility(
            CARD_TYPE_RESOURCE,
            'Recurso de prueba'
        );
        assert.equal(gamoraThwartAbility.actor, superhero);
        assert.equal(eventAbility.actor, superhero);
        assert.equal(upgradeAbility.actor, superhero);
        assert.equal(allyThwartAbility.actor, ally);
        assert.equal(supportAction.actor, support);
        assert.equal(resourceAbility.actor, resourceAbility.card);
        assert.equal(eventAbility.card.isPlayerCard, true);
        assert.equal(upgradeAbility.card.isPlayerCard, true);
        assert.equal(resourceAbility.card.isResource, true);
        assert.equal(eventAbility.card.isEvent, true);
        assert.equal(upgradeAbility.card.isUpgrade, true);

        const allowedAbilities = [
            gamoraThwartAbility,
            eventAbility,
            upgradeAbility,
        ];
        const blockedAbilities = [
            {ability: allyThwartAbility, player},
            {ability: resourceAbility, player},
            {ability: supportAction, player},
            {ability: thorThwartAbility, player: thor},
        ];
        for (const ability of allowedAbilities) {
            const effects = createThreatRemovalEffects(ability);
            for (const effect of effects) {
                assert.deepEqual(effect.effectCategories, [
                    EFFECT_CATEGORY_THREAT_REMOVAL,
                ]);
                assert.ok(effect.getValidTarget({
                    match,
                    player,
                    card: ability.card,
                }).includes(scheme));
            }
        }

        for (const {ability, player: actingPlayer} of blockedAbilities) {
            for (const effect of createThreatRemovalEffects(ability)) {
                const targets = effect.getValidTarget({
                    match,
                    player: actingPlayer,
                    card: ability.card,
                });
                assert.ok(!targets.includes(scheme));
                assert.ok(targets.includes(otherScheme));
            }
        }

        const actualAllyThwartTargets =
            allyThwartAbility.effect.getValidTarget({
                match,
                player,
                card: ally,
            });
        assert.ok(!actualAllyThwartTargets.includes(scheme));
        assert.ok(actualAllyThwartTargets.includes(otherScheme));

        const availableAllyAbilities =
            await getAbilitiesWithAvailability(ally, player);
        const availableAllyThwart = availableAllyAbilities.find(({name}) =>
            name === allyThwartAbility.name);
        assert.ok(availableAllyThwart);
        assert.equal(
            availableAllyThwart.availableTargetIds?.includes(scheme.id) ?? false,
            false
        );

        const preselectedAllyThwart = new RemoveThreatEffect({
            ability: allyThwartAbility,
            fixedPreselectedTarget: true,
            match,
            selectedTarget: scheme,
            target: TARGET_SCHEME,
            threat: 1,
        });
        assert.deepEqual(preselectedAllyThwart.getValidTarget({
            match,
            player,
            card: ally,
            fixedPreselectedTarget: true,
        }), []);

        const moveThreat = new MoveThreatEffect({
            ability: thorThwartAbility,
            fromTarget: TARGET_SCHEME,
            match,
            selectedTarget: otherScheme,
            target: TARGET_SCHEME,
            threat: 1,
        });
        const destinationTarget = moveThreat.createDestinationValidTarget();
        assert.equal(destinationTarget.filter(scheme, {
            effect: moveThreat,
            match,
            player: thor,
            target: TARGET_SCHEME,
        }), true);

        const dealtTo = [];
        const encounterCard = {name: 'Encounter'};
        match.drawEncounterCards = async count => {
            assert.equal(count, 1);
            return [encounterCard];
        };
        for (const target of [player, thor]) {
            target.gameZone.dealEncounterCard = cards =>
                dealtTo.push([target.name, ...cards]);
            target.gameZone.refresh = async () => {};
        }

        await scheme.abilities[1].resolveAbility({
            match,
            player: thor,
            card: scheme,
        });
        assert.deepEqual(dealtTo, [['Gamora', encounterCard]]);
    });

    test('marks Nébula as the nemesis minion and removes the Nébula Ally on entry', async () => {
        const hero = await getGamora();
        const {card} = getNemesisCard(hero, 'Nébula');
        const [entryInterrupt] = card.params.abilities;

        assert.equal(card.params.attack, 2);
        assert.equal(card.params.scheme, 1);
        assert.equal(card.params.hitPoints, 5);
        assert.equal(entryInterrupt.type, ABILITY_FORCED_INTERRUPT);
        assert.equal(entryInterrupt.params.trigger, TRIGGER_CARD_ENTER_PLAY);
        assert.equal(entryInterrupt.params.workBeforeEnterPlay, true);
        assert.deepEqual(entryInterrupt.params.effect, {
            type: EFFECT_DISCARD_GAME,
            params: {
                target: TARGET_ALL_ALLIES,
                condition: {isAlly: true, name: 'Nébula'},
            },
        });
    });

    test('Nébula discards the matching Ally when the Minion enters play', async () => {
        const {hero, match, matchFactory, player, scenario} = await createGame();
        const minionEntry = getNemesisCard(hero, 'Nébula');
        const nebulaAllyEntry = hero.config.cards.find(({card}) =>
            card.params.name === 'Nébula');
        assert.ok(nebulaAllyEntry);
        const nebulaAlly = matchFactory.cardsFactory.createGameCardFromConfig(
            nebulaAllyEntry.card,
            {owner: player}
        );
        nebulaAlly.controller = player;
        await player.addToGameZone(nebulaAlly);
        player.deck.cards.push(matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {name: 'Remaining player card', resources: ['physical']},
        }, {owner: player}));

        const minion = matchFactory.cardsFactory.createGameCardFromConfig(
            minionEntry.card,
            {owner: scenario}
        );
        assert.equal(minion.isInPlay, false);
        assert.equal(minion.abilities[0].workBeforeEnterPlay, true);
        assert.equal(match.triggerCards[minion.id], undefined);
        assert.equal(minion.triggers[TRIGGER_CARD_ENTER_PLAY], undefined);
        const putPlayEffect = new PutPlayEffect({
            card: minion,
            controller: scenario,
            match,
        });
        const openDialog = match.openDialog;
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_USE_CARD &&
                dialog.data.cards.some(({id}) => id === minion.id)) {
                return {selected: {id: minion.id}};
            }

            return openDialog(dialog);
        };

        await putPlayEffect.runEffect({player});

        assert.equal(player.allies.includes(nebulaAlly), false);
        assert.ok(player.deck.discardPile.includes(nebulaAlly));
    });

    test('Nébula discards Gamora’s unique Ally before the unique-card check', async () => {
        const {hero, match, matchFactory, player, scenario} = await createGame();
        const nebulaAllyEntry = hero.config.cards.find(({card}) =>
            card.params.name === 'Nébula');
        assert.ok(nebulaAllyEntry);
        const nebulaAlly = matchFactory.cardsFactory.createGameCardFromConfig(
            nebulaAllyEntry.card,
            {owner: player}
        );
        nebulaAlly.controller = player;
        await player.addToGameZone(nebulaAlly);
        player.deck.cards.push(matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {name: 'Remaining player card', resources: ['physical']},
        }, {owner: player}));

        const minion = matchFactory.cardsFactory.createGameCardFromConfig(
            getNemesisCard(hero, 'Nébula').card,
            {owner: scenario}
        );
        assert.equal(match.triggerCards[minion.id], undefined);
        match.openPublicDialog = async () => {};
        const openDialog = match.openDialog;
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_USE_CARD &&
                dialog.data.cards.some(({id}) => id === minion.id)) {
                return {selected: {id: minion.id}};
            }

            return openDialog(dialog);
        };

        assert.equal(match.isUniqueCard(minion), true);

        await new RevealEncounterEffect({
            card: minion,
            match,
            player,
        }).runEffect({player});

        assert.equal(minion.controller, scenario);
        assert.equal(minion.engaged, player);
        assert.equal(player.allies.includes(nebulaAlly), false);
        assert.ok(player.deck.discardPile.includes(nebulaAlly));
        assert.equal(match.isUniqueCard(minion), false);
    });

    test('blanks Gamora while attached and defines the action costs', async () => {
        const hero = await getGamora();
        const {card} = getNemesisCard(hero, 'Contra las cuerdas');
        const [blankText, action] = card.params.abilities;

        assert.deepEqual(card.params.attach, {
            target: TARGET_SOURCE,
            source: 'match.players.*.superhero',
            condition: {mainName: 'Gamora'},
        });
        assert.equal(blankText.params.trigger, TRIGGER_CARD_ENTER_PLAY);
        assert.deepEqual(blankText.params.effect, {
            type: EFFECT_BLANK_TEXT,
            params: {target: TARGET_ATTACHED},
        });
        assert.equal(action.type, ABILITY_HERO_ACTION);
        assert.equal(action.params.arrow.type, EFFECT_SIMULTANEOUS);
        assert.deepEqual(action.params.arrow.params.effects, [
            {
                type: EFFECT_SELECT_DISCARD_CARD,
                params: {
                    target: TARGET_YOU,
                    count: 1,
                    filter: {isEvent: true, traits: TRAIT_ATTACK},
                    title: 'Elige y descarta 1 Evento de Ataque de tu mano',
                },
            },
            {
                type: EFFECT_DEAL_DAMAGE,
                params: {target: TARGET_ATTACHED, damage: 1},
            },
        ]);
        assert.deepEqual(action.params.effect, {
            type: EFFECT_DISCARD_GAME,
            params: {target: TARGET_THIS},
        });
    });

    test('the attachment targets Gamora across separate play areas', async () => {
        const {hero, match, matchFactory, player, scenario, superhero} =
            await createGame();
        const attachmentConfig = getNemesisCard(
            hero,
            'Contra las cuerdas'
        ).card;
        const attachment = matchFactory.cardsFactory.createGameCardFromConfig(
            attachmentConfig,
            {owner: scenario}
        );
        const {heroes} = await loadCatalog();
        const thorEntry = heroes.find(({_id}) => _id === 'thor');
        assert.ok(thorEntry);

        const thorSuperhero = matchFactory.createSuperhero({
            ...thorEntry.config,
            cards: [],
            precon: [],
            nemesis: [],
            obligation: undefined,
        });
        thorSuperhero.selectedSide = 1;
        const thor = match.createPlayer({
            name: 'Thor',
            superhero: thorSuperhero,
        });
        thor.initPlayer();
        thor.gameZone = new PlayerZone({owner: thor});
        scenario.separatePlayAreas = true;
        const thorZone = scenario.createZone({id: 'thor-scenario-zone'});
        thorZone.addPlayer(thor);

        match.phase = PHASE_PLAYERS;
        match.playing = true;
        scenario.gameZone.refresh = async () => {};
        thorZone.refresh = async () => {};
        superhero.refresh = async () => {};
        thorSuperhero.refresh = async () => {};
        assert.deepEqual(scenario.gameZone.players.map(({name}) => name), [
            'Gamora',
        ]);
        assert.deepEqual(thorZone.players.map(({name}) => name), ['Thor']);

        const alterEgoEvent =
            matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_EVENT,
                params: {
                    name: 'Evento de ataque para probar',
                    set: 'test',
                    traits: [TRAIT_ATTACK],
                },
            }, {owner: player});
        player.deck.cards.unshift(alterEgoEvent);
        superhero.selectedSide = 0;

        const heroValues = [
            superhero.sides[1].attack,
            superhero.sides[1].defense,
            superhero.sides[1].thwart,
        ];
        const heroTraits = [...superhero.sides[1].traits];

        await new RevealEncounterEffect({
            card: attachment,
            match,
            player: thor,
        }).runEffect({player: thor});

        assert.equal(attachment.attachedTo.id, superhero.id);
        assert.equal(superhero.printedTextBlank, true);
        assert.equal(superhero.sides[0].printedTextBlank, true);
        assert.equal(superhero.sides[1].printedTextBlank, true);

        const blankedAlterEgoAbilities =
            await getAbilitiesWithAvailability(superhero, player);
        assert.equal(blankedAlterEgoAbilities[0].disable, true);
        await player.resolveAbility(superhero.id, 0);
        assert.ok(player.deck.cards.includes(alterEgoEvent));

        superhero.selectedSide = 1;
        const basicAttributeAbility = new Ability({
            card: superhero.currentSide,
            effect: {canRun: async () => true},
            match,
        });
        basicAttributeAbility.isBasic = true;
        assert.equal(
            await basicAttributeAbility.canRun({player, card: superhero}),
            true
        );

        const printedHeroAbilities = superhero.currentSide.abilities.filter(
            ({isBasic}) => !isBasic
        );
        assert.ok(printedHeroAbilities.length > 0);
        for (const ability of printedHeroAbilities) {
            assert.equal(await ability.canRun({player}), false);
        }
        assert.deepEqual([
            superhero.sides[1].attack,
            superhero.sides[1].defense,
            superhero.sides[1].thwart,
        ], heroValues);
        assert.deepEqual(superhero.sides[1].traits, heroTraits);

        const attackEvent = matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_EVENT,
            params: {
                name: 'Evento de Ataque',
                set: 'test',
                traits: [TRAIT_ATTACK],
            },
        }, {owner: player});
        player.hand.addCard(attackEvent);
        player.deck.cards.push(matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {name: 'Remaining player card', resources: ['physical']},
        }, {owner: player}));

        await attachment.abilities[1].resolveAbility({
            match,
            player,
            card: attachment,
        });

        assert.equal(superhero.damage, 1);
        assert.ok(player.deck.discardPile.includes(attackEvent));
        assert.equal(scenario.gameZone.cards.includes(attachment), false);
    });

    test('the attachment finds and blanks Gamora in hero form', async () => {
        const {hero, match, matchFactory, player, scenario, superhero} =
            await createGame();
        const attachment = matchFactory.cardsFactory.createGameCardFromConfig(
            getNemesisCard(hero, 'Contra las cuerdas').card,
            {owner: scenario}
        );
        scenario.gameZone.refresh = async () => {};
        superhero.refresh = async () => {};

        assert.equal(superhero.currentSide.isHero, true);
        await new RevealEncounterEffect({
            card: attachment,
            match,
            player,
        }).runEffect({player});

        assert.equal(attachment.attachedTo, superhero);
        assert.deepEqual(
            superhero.sides.map(side => side.printedTextBlank),
            [true, true]
        );
    });

    test('surges only if Gamora was already stunned or confused, then applies both statuses', async () => {
        const hero = await getGamora();
        const {card} = getNemesisCard(hero, 'Atacada a traición');
        const [surge, applyStatuses] = card.params.abilities;
        const statusCondition = surge.params.condition;

        assert.equal(surge.type, ABILITY_WHEN_REVEALED);
        assert.equal(surge.params.effect.type, EFFECT_SURGE);
        assert.equal(applyStatuses.type, ABILITY_WHEN_REVEALED);
        assert.deepEqual(applyStatuses.params.effect, {
            type: EFFECT_SIMULTANEOUS,
            params: {
                effects: [
                    {
                        type: EFFECT_STUN,
                        params: {
                            target: TARGET_ALL_SUPERHEROES,
                            condition: {mainName: 'Gamora'},
                        },
                    },
                    {
                        type: EFFECT_CONFUSE,
                        params: {
                            target: TARGET_ALL_SUPERHEROES,
                            condition: {mainName: 'Gamora'},
                        },
                    },
                ],
            },
        });

        const playerState = (mainName, isStunned, isConfused) => ({
            reveal: {
                match: {
                    players: [{
                        superhero: {mainName, isStunned, isConfused},
                    }],
                },
            },
        });
        assert.equal(checkCondition(playerState('Gamora', true, false), statusCondition), true);
        assert.equal(checkCondition(playerState('Gamora', false, true), statusCondition), true);
        assert.equal(checkCondition(playerState('Gamora', false, false), statusCondition), false);
        assert.equal(checkCondition(playerState('Drax', true, false), statusCondition), false);
    });

    test('all new cards compile into runtime abilities', async () => {
        const hero = await getGamora();
        const cardsFactory = new CardsFactory({
            match: {
                players: [],
                triggerCards: {},
            },
        });
        const cards = [
            hero.config.obligation.card,
            ...hero.config.nemesis.map(({card}) => card),
        ];

        for (const cardConfig of cards) {
            const gameCard = cardsFactory.createGameCardFromConfig(cardConfig);
            assert.ok(gameCard.abilities.length, cardConfig.params.name);

            for (const ability of gameCard.abilities) {
                assert.ok(
                    ability.effect || ability.validation,
                    `${cardConfig.params.name} has an empty ability`
                );
                if (ability.effect) {
                    assert.equal(typeof ability.effect.canRun, 'function');
                }
            }
        }
    });

    test('resolving the Obligation discards exactly two Events from hand', async () => {
        const {match, matchFactory, player, superhero} = await createGame();
        const obligation = superhero.obligations.find(({name}) =>
            name === 'Destino inconcluso');
        assert.ok(obligation);
        obligation.owner = player;
        await player.addToGameZone(obligation);

        const events = [1, 2].map(index =>
            matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_EVENT,
                params: {
                    name: `Evento ${index}`,
                    set: 'test',
                },
            }, {owner: player}));
        events.forEach(event => player.hand.addCard(event));
        player.deck.cards.push(matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name: 'Recurso de prueba',
                set: 'test',
                resources: ['physical'],
            },
        }, {owner: player}));

        const resolver = obligation.abilities.find(({effect}) =>
            effect?.effectType === EFFECT_CHOOSE_ABILITY);
        assert.ok(resolver);
        const discardEvents = resolver.effect.options[1];
        await discardEvents.resolveAbility({match, player, card: obligation});

        assert.deepEqual(player.hand.cards, []);
        events.forEach(event =>
            assert.ok(player.deck.discardPile.includes(event)));
        assert.equal(player.gameZone.cards.includes(obligation), false);
    });

    test("resolving the Obligation exhausts Gamora's alter ego and removes the card", async () => {
        const {match, player, superhero} = await createGame();
        const obligation = superhero.obligations.find(({name}) =>
            name === 'Destino inconcluso');
        assert.ok(obligation);
        obligation.owner = player;
        await player.addToGameZone(obligation);
        superhero.selectedSide = 0;

        const resolver = obligation.abilities.find(({effect}) =>
            effect?.effectType === EFFECT_CHOOSE_ABILITY);
        assert.ok(resolver);
        await resolver.effect.options[0].resolveAbility({
            match,
            player,
            card: obligation,
        });

        assert.equal(player.exhausted, true);
        assert.equal(player.gameZone.cards.includes(obligation), false);
        assert.ok(match.removedCards.includes(obligation));
    });

    test('revealing Atacada a traición applies Stun and Confuse without gaining Surge', async () => {
        const {hero, match, matchFactory, player, scenario, superhero} =
            await createGame();
        const treacheryEntry = getNemesisCard(hero, 'Atacada a traición');
        const treachery = matchFactory.cardsFactory.createGameCardFromConfig(
            treacheryEntry.card,
            {owner: scenario}
        );
        assert.equal(treachery.isEncounterCard, true);
        assert.equal(treachery.isTreachery, true);

        const reveal = new RevealEncounterEffect({
            card: treachery,
            match,
            player,
        });
        await reveal.runEffect({player});

        assert.equal(reveal.resolved, true);
        assert.equal(reveal.surge, false);
        assert.equal(superhero.isStunned, true);
        assert.equal(superhero.isConfused, true);
    });

    test('Atacada a traición gains Surge when Gamora already has either status', async () => {
        for (const status of ['stunned', 'confused']) {
            const {hero, match, matchFactory, player, scenario, superhero} =
                await createGame();
            superhero[status] = 1;

            const treacheryEntry = getNemesisCard(hero, 'Atacada a traición');
            const treachery = matchFactory.cardsFactory.createGameCardFromConfig(
                treacheryEntry.card,
                {owner: scenario}
            );
            const [surgeAbility] = treachery.abilities;
            const reveal = {match, surge: false};

            assert.equal(
                await surgeAbility.canRun({
                    match,
                    player,
                    card: treachery,
                    reveal,
                }),
                true
            );
            await surgeAbility.resolveAbility({
                match,
                player,
                card: treachery,
                reveal,
            });

            assert.equal(reveal.surge, true);
        }
    });
});
