import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_BOOST,
    CALC_ALL,
    CARD_TYPE_MINION,
    CARD_TYPE_TREACHERY,
    DIALOG_USE_CARD,
    EFFECT_CHAINED,
    EFFECT_DEFEAT,
    EFFECT_DO_IF,
    EFFECT_DISCARD_UNTIL,
    EFFECT_ENGAGE,
    EFFECT_HEAL,
    EFFECT_REMOVE_THREAT,
    RESOURCE_ENERGY,
    TARGET_ALL_FRIENDLY_CHARACTERS,
    TARGET_ENCOUNTER_DECK,
    TRIGGER_THIS_ENTER_PLAY,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Deck} from '../../src/model/match/deck.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';
import {getAbilitiesWithAvailability} from '../../src/utils/ability-availability.js';

test('Thor catalog loads and all precon references resolve', async () => {
    const catalog = await loadCatalog();
    const thor = catalog.heroes.find(hero => hero._id === 'thor');
    assert.ok(thor);

    const aspectCards = new Map(catalog.aspects.map(card => [card._id, card]));
    const references = thor.config.precon.flatMap(aspect =>
        aspect.cardRefs.map(reference => ({
            ...reference,
            aspect: aspect.aspect,
        })));

    references.forEach(({id, aspect}) => {
        assert.ok(aspectCards.has(id), `Missing precon card ${id}`);
        assert.equal(aspectCards.get(id).aspect, aspect);
        assert.equal(aspectCards.get(id).card.params.set, aspect);
    });
    assert.equal(references.reduce((total, {count}) => total + count, 0), 25);
    assert.equal(references.find(({id}) => id === 'aggression-valquiria').count, 1);
    assert.equal(references.find(({id}) => id === 'basic-invulnerabilidad').count, 3);
    assert.equal(
        references.find(({id}) =>
            id === 'aggression-the-power-of-aggression').count,
        2
    );

    const sif = thor.config.cards.find(({card}) =>
        card.params.name === 'Dama Sif');
    assert.equal(sif.count, 1);
    assert.equal(thor.config.obligation.card.params.boost, 2);
    const heimdall = thor.config.precon
        .find(({aspect}) => aspect === 'basic')
        .cardRefs.find(({id}) => id === 'basic-heimdall');
    const heimdallCard = aspectCards.get(heimdall.id);
    assert.equal(
        heimdallCard.card.params.abilities[0].params.effect.params.target,
        TARGET_ENCOUNTER_DECK
    );

    const defender = thor.config.cards.find(({card}) =>
        card.params.name === 'Defensor de los Nueve Reinos');
    const [defenderAbility] = defender.card.params.abilities;
    const {arrow, effect} = defenderAbility.params;
    assert.equal(arrow.type, EFFECT_CHAINED);
    assert.deepEqual(arrow.params.outputParams, ['selectedCard']);
    assert.deepEqual(
        arrow.params.effects.map(cost => cost.type),
        [EFFECT_DISCARD_UNTIL, EFFECT_ENGAGE]
    );
    assert.equal(effect.type, EFFECT_DO_IF);
    assert.deepEqual(
        effect.params.condition,
        {'selectedCard.type': CARD_TYPE_MINION}
    );
    assert.equal(effect.params.effect.type, EFFECT_REMOVE_THREAT);

    const lightning = thor.config.cards.find(({card}) =>
        card.params.name === 'Relámpago');
    const lightningAbility = lightning.card.params.abilities[0];
    const {effect: aerialBranch, effectNot: normalBranch} =
        lightningAbility.params.effect.params;
    assert.equal(aerialBranch.params.ignoreTough, true);
    assert.equal(aerialBranch.params.keywords?.piercing, undefined);
    assert.equal(normalBranch.params.ignoreTough, undefined);
});

test('Digno is available only while Mjolnir is in Thor deck or discard pile', async () => {
    const catalog = await loadCatalog();
    const thor = catalog.heroes.find(hero => hero._id === 'thor');
    const match = new Match({
        mc: {
            mcSocket: {
                send() {},
            },
        },
        name: 'thor-worthy',
    });
    const matchFactory = new MatchFactory(match);
    const thorSuperhero = matchFactory.createSuperhero(thor.config);
    thorSuperhero.selectedSide = 0;
    const player = match.createPlayer({
        name: 'Thor',
        superhero: thorSuperhero,
    });
    player.deck = new Deck({owner: player, isPlayerDeck: true});

    const mjolnir = {
        id: 'mjolnir',
        name: 'Mjolnir',
        owner: player,
    };
    const isDignoDisabled = async () => {
        const abilities = await getAbilitiesWithAvailability(thorSuperhero, player);
        const ability = abilities.find(({name}) => name === 'Digno');

        return ability.disable;
    };

    player.hand.cards = [mjolnir];
    assert.equal(await isDignoDisabled(), true);

    player.hand.cards = [];
    player.deck.cards = [mjolnir];
    assert.equal(await isDignoDisabled(), false);

    player.deck.cards = [];
    player.deck.discardPile = [mjolnir];
    assert.equal(await isDignoDisabled(), false);

    player.deck.discardPile = [];
    assert.equal(await isDignoDisabled(), true);
});

test('Relámpago damages the villain and engaged Guard minions without being an attack', async () => {
    const catalog = await loadCatalog();
    const thor = catalog.heroes.find(hero => hero._id === 'thor');
    const match = new Match({
        mc: {
            mcSocket: {
                send() {},
            },
        },
        name: 'thor-lightning-strike',
    });
    const matchFactory = new MatchFactory(match);
    const thorSuperhero = matchFactory.createSuperhero(thor.config);
    thorSuperhero.selectedSide = 1;
    const player = match.createPlayer({
        name: 'Thor',
        superhero: thorSuperhero,
    });
    player.gameZone = new PlayerZone({owner: player});

    const createEnemy = ({
        guard = false,
        isVillain = false,
        name,
        retaliate = 0,
    }) => ({
        canBeAttacked: targetPlayer => !isVillain || !targetPlayer.hasGuard,
        damage: 0,
        guard,
        hitPoints: 20,
        id: name,
        isEnemy: true,
        isInPlay: true,
        isMinion: !isVillain,
        isVillain,
        name,
        retaliate,
        async getLife() {
            return this.hitPoints - this.damage;
        },
        placeDamage(damage) {
            this.damage += damage;
        },
        async refresh() {},
    });
    const villain = createEnemy({isVillain: true, name: 'Villano'});
    const guardMinion = createEnemy({
        guard: true,
        name: 'Esbirro con Guardia',
        retaliate: 1,
    });
    const scenario = {
        gameZone: {
            cards: [],
            currentVillain: villain,
        },
        get villain() {
            return this.gameZone.currentVillain;
        },
    };
    match.scenario = scenario;
    player.gameZone.engage(guardMinion);

    const lightningConfig = thor.config.cards.find(({card}) =>
        card.params.name === 'Relámpago').card;
    const lightning = matchFactory.cardsFactory.createGameCardFromConfig(
        lightningConfig,
        {owner: player}
    );
    const [ability] = lightning.abilities;

    assert.equal(player.hasGuard, true);
    assert.equal(ability.isAttack, false);
    ability.arrow.cost.paid = [RESOURCE_ENERGY, RESOURCE_ENERGY];

    await ability.resolveAbility({
        arrowPaid: true,
        card: lightning,
        match,
        player,
    });

    assert.equal(villain.damage, 2);
    assert.equal(guardMinion.damage, 2);
    assert.equal(thorSuperhero.currentSide.damage, 0);
});

test('Defensor de los Nueve Reinos triggers Thor draw response when it engages a minion', async () => {
    const catalog = await loadCatalog();
    const thor = catalog.heroes.find(hero => hero._id === 'thor');
    const match = new Match({
        mc: {
            mcSocket: {
                send() {},
            },
        },
        name: 'thor-defender-of-the-nine-realms',
    });
    const matchFactory = new MatchFactory(match);
    const thorSuperhero = matchFactory.createSuperhero(thor.config);
    thorSuperhero.selectedSide = 1;
    const player = match.createPlayer({
        name: 'Thor',
        superhero: thorSuperhero,
    });
    player.gameZone = new PlayerZone({owner: player});
    player.gameZone.refresh = async () => {};
    player.refresh = async () => {};
    player.hand.refresh = async () => {};
    thorSuperhero.refresh = async () => {};
    thorSuperhero.sides.forEach(side => {
        side.refresh = async () => {};
    });

    let drawnCards = 0;
    let threatWhenDrawn;
    let minionEngagedWhenDrawn = false;
    player.deck = {
        async draw(count) {
            drawnCards += count;
            threatWhenDrawn = match.mainScheme.threat;
            minionEngagedWhenDrawn = player.gameZone.minions.length > 0;

            return [];
        },
        async discard() {},
    };

    const minion = {
        damage: 0,
        isInPlay: false,
        isMinion: true,
        isPlayerCard: false,
        name: 'Esbirro de prueba',
        type: CARD_TYPE_MINION,
        async initTriggers() {},
        toObj() {
            return {name: this.name};
        },
    };
    const scenarioDeck = {
        isScenarioDeck: true,
        cards: [minion],
        discardPile: [],
        async discardUntil(_condition, _removeFromDiscard, discardedCards) {
            this.cards = [];
            this.discardPile.push(minion);
            discardedCards?.push(minion);

            return minion;
        },
        removeCardFromDeck(card) {
            this.cards = this.cards.filter(candidate => candidate !== card);
        },
        searchDiscard(card) {
            this.discardPile = this.discardPile.filter(candidate =>
                candidate !== card);
        },
        async refresh() {},
    };
    const mainScheme = {
        isMainScheme: true,
        threat: 5,
        canRemoveThreat() {
            return true;
        },
        removeThreat(count) {
            this.threat -= count;
        },
        async refresh() {},
    };
    const scenario = {
        deck: scenarioDeck,
        mainScheme,
        schemes: [mainScheme],
    };
    minion.owner = scenario;
    match.scenario = scenario;

    const dialogs = [];
    match.openDialog = async dialog => {
        dialogs.push(dialog);
        if (dialog.dialogType === DIALOG_USE_CARD) {
            return {
                selected: {id: thorSuperhero.currentSide.id},
            };
        }
    };

    await thorSuperhero.initTriggers();
    const defenderConfig = thor.config.cards.find(({card}) =>
        card.params.name === 'Defensor de los Nueve Reinos').card;
    const defender = matchFactory.cardsFactory.createGameCardFromConfig(
        defenderConfig,
        {owner: player}
    );
    player.hand.addCard(defender);
    const playEffect = new PlayCardEffect({
        ability: defender.abilities[0],
        card: defender,
        match,
    });

    await playEffect.runEffect({
        card: defender,
        match,
        player,
    });

    assert.equal(minion.engaged, player);
    assert.equal(mainScheme.threat, 2);
    assert.ok(dialogs.some(({dialogType, data}) =>
        dialogType === DIALOG_USE_CARD &&
        data.cards.some(({abilityNames}) =>
            abilityNames.includes('¡Defiéndete!'))));
    assert.equal(drawnCards, 2);
    assert.equal(minionEngagedWhenDrawn, true);
    assert.equal(threatWhenDrawn, 5);
    assert.equal(mainScheme.threat, 2);
});

test('Dama Sif readies Thor or Odinson when another player puts her into play', async () => {
    const catalog = await loadCatalog();
    const thor = catalog.heroes.find(hero => hero._id === 'thor');
    const sif = thor.config.cards.find(({card}) =>
        card.params.name === 'Dama Sif');
    const [sifResponse] = sif.card.params.abilities;
    const readyConfig = sifResponse.params.effect;

    assert.equal(
        readyConfig.params.target,
        TARGET_ALL_FRIENDLY_CHARACTERS
    );
    assert.deepEqual(readyConfig.params.condition, {mainName: 'Thor'});

    for (const form of ['Thor', 'Odinson']) {
        const runtimeCatalog = await loadCatalog();
        const runtimeThor = runtimeCatalog.heroes.find(hero =>
            hero._id === 'thor');
        const blackPanther = runtimeCatalog.heroes.find(hero =>
            hero._id === 'blackpanther');
        const runtimeSif = runtimeThor.config.cards.find(({card}) =>
            card.params.name === 'Dama Sif');
        const match = new Match({
            mc: {
                mcSocket: {
                    send() {},
                },
            },
            name: `dama-sif-${form}`,
        });
        match.scenario = {
            gameZone: {
                cards: [],
                currentScheme: undefined,
            },
            villain: undefined,
        };
        const matchFactory = new MatchFactory(match);
        const thorSuperhero = matchFactory.createSuperhero(runtimeThor.config);
        const thorPlayer = match.createPlayer({
            name: 'Thor',
            superhero: thorSuperhero,
        });
        thorPlayer.gameZone = new PlayerZone({owner: thorPlayer});
        thorPlayer.gameZone.refresh = async () => {};
        thorSuperhero.refresh = async () => {};
        thorSuperhero.sides.forEach(side => {
            side.refresh = async () => {};
        });

        const callerSuperhero =
            matchFactory.createSuperhero(blackPanther.config);
        const caller = match.createPlayer({
            name: 'Otro jugador',
            superhero: callerSuperhero,
        });
        caller.gameZone = new PlayerZone({owner: caller});
        caller.gameZone.refresh = async () => {};
        callerSuperhero.refresh = async () => {};
        callerSuperhero.sides.forEach(side => {
            side.refresh = async () => {};
        });
        match.openDialog = async ({data}) => ({
            selected: data.cards[0],
        });

        thorSuperhero.selectedSide = form === 'Thor' ? 1 : 0;
        thorSuperhero.exhaust();
        callerSuperhero.exhaust();
        const sifCard = matchFactory.cardsFactory.createGameCardFromConfig(
            runtimeSif.card,
            {owner: thorPlayer}
        );
        const ownerDiscardPile = [sifCard];
        thorPlayer.deck = {
            discardPile: ownerDiscardPile,
            async refresh() {},
            searchDiscard(card) {
                const index = ownerDiscardPile.indexOf(card);
                if (index > -1) {
                    ownerDiscardPile.splice(index, 1);
                }
            },
        };
        const sifAbility = sifCard.abilities.find(ability =>
            ability.trigger === TRIGGER_THIS_ENTER_PLAY);
        assert.ok(sifAbility);
        assert.equal(sifCard.isEvent, false);
        assert.equal(sifCard.isAlly, true);
        assert.ok(match.friends.includes(thorSuperhero));
        const sifTargets = (
            await sifAbility.effect.getValidTarget({
                match,
                player: caller,
                card: sifCard,
            })
        ).flat(Infinity);
        assert.ok(sifTargets.includes(thorSuperhero));
        assert.equal(
            await sifAbility.effect.canRun({
                match,
                player: caller,
                card: sifCard,
            }),
            true
        );
        const putPlayEffect = new PutPlayEffect({
            card: sifCard,
            controller: caller,
            match,
        });

        await putPlayEffect.runEffect({
            match,
            player: caller,
            card: sifCard,
        });

        assert.equal(sifAbility.resolved, true);
        assert.equal(thorSuperhero.exhausted, false, form);
        assert.equal(callerSuperhero.exhausted, true, form);
        assert.equal(sifCard.controller, caller);
        assert.deepEqual(ownerDiscardPile, []);
    }
});

test('Thor nemesis set identifies Loki and compiles the Ice Giant boost ability', async () => {
    const catalog = await loadCatalog();
    const thor = catalog.heroes.find(hero => hero._id === 'thor');
    const minions = thor.config.nemesis.filter(({card}) =>
        card.type === CARD_TYPE_MINION);
    const markedMinions = minions.filter(({card}) =>
        card.params.nemesis === true);

    assert.deepEqual(
        markedMinions.map(({card}) => card.params.name),
        ['Loki']
    );
    const loki = thor.config.nemesis.find(({card}) =>
        card.params.name === 'Loki').card;
    const lokiEffects = loki.params.abilities[0].params.effect.params.effects;
    const treacheryBranch = lokiEffects[1].params.effect.params.effects;
    const heal = treacheryBranch[1];
    assert.equal(heal.type, EFFECT_HEAL);
    assert.equal(heal.params.damage, 0);
    assert.equal(heal.params.allowNoDamage, true);
    assert.deepEqual(heal.params.paramsCalc, {
        formula: CALC_ALL,
        target: 'effect.selectedTarget',
    });
    assert.equal(
        thor.config.nemesis.find(({card}) =>
            card.params.name === 'Gigante de hielo').count,
        2
    );

    const matchFactory = new MatchFactory({triggerCards: {}});
    const cardsFactory = matchFactory.cardsFactory;
    const iceGiant = thor.config.nemesis.find(({card}) =>
        card.params.name === 'Gigante de hielo').card;
    const gameCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(iceGiant),
        owner: {},
    });

    assert.equal(iceGiant.params.boostAbility.type, ABILITY_BOOST);
    assert.equal(typeof gameCard.boostAbility.effect.canRun, 'function');
});

test('Loki discards the top encounter card and avoids defeat when it is a treachery', async () => {
    const catalog = await loadCatalog();
    const thor = catalog.heroes.find(hero => hero._id === 'thor');
    const match = new Match({
        mc: {
            mcSocket: {
                send() {},
            },
        },
        name: 'thor-loki-prevent-defeat',
    });
    const matchFactory = new MatchFactory(match);
    const superhero = matchFactory.createSuperhero(thor.config);
    const player = match.createPlayer({
        name: 'Thor',
        superhero,
    });
    player.gameZone = new PlayerZone({owner: player});
    player.gameZone.refresh = async () => {};

    const scenario = {
        gameZone: {
            async discard() {},
        },
        match,
    };
    scenario.deck = new Deck({
        isScenarioDeck: true,
        owner: scenario,
    });
    scenario.deck.refresh = async () => {};
    const treachery = {
        type: CARD_TYPE_TREACHERY,
        toObj() {
            return {type: this.type};
        },
    };
    const nextCard = {
        type: CARD_TYPE_MINION,
        toObj() {
            return {type: this.type};
        },
    };
    scenario.deck.cards = [treachery, nextCard];
    match.scenario = scenario;

    const lokiConfig = thor.config.nemesis.find(({card}) =>
        card.params.name === 'Loki').card;
    const loki = matchFactory.cardsFactory.createGameCardFromConfig(
        lokiConfig,
        {owner: scenario}
    );
    loki.controller = player;
    loki.engaged = player;
    loki.damage = 8;
    loki.refresh = async () => {};
    player.gameZone.engage(loki);
    let defeatCount = 0;
    loki.defeat = async () => {
        defeatCount++;
    };

    match.openDialog = async ({dialogType}) => {
        if (dialogType === DIALOG_USE_CARD) {
            return {selected: {id: loki.id}};
        }
    };
    await loki.initTriggers();

    const defeat = new DefeatEffect({
        effectType: EFFECT_DEFEAT,
        match,
        selectedTarget: loki,
    });
    await defeat.runEffect({match, player});

    assert.equal(scenario.deck.discardPile[0], treachery);
    assert.equal(scenario.deck.cards[0], nextCard);
    assert.equal(defeat.prevented, true);
    assert.equal(defeatCount, 0);
    assert.equal(loki.damage, 0);
});
