import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ACTION,
    ABILITY_WHEN_REVEALED,
    DIALOG_LIST,
    DIALOG_PAY_COST,
    DIALOG_SELECT_CARD,
    DIALOG_SELECT_TARGET,
    DIALOG_USE_CARD,
    EFFECT_CANCEL_CARD_EFFECTS,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_GET_TOP_CARD,
    EFFECT_LASTING,
    EFFECT_MODIFY_TRAITS,
    EFFECT_PAY_PRINTED_COST,
    EFFECT_RETURN_FACEDOWN,
    EFFECT_RESOLVE_SPECIAL_ABILITY,
    EFFECT_SIMULTANEOUS,
    EFFECT_STUN,
    PRIORITY_FORCED_INTERRUPT,
    PRIORITY_FORCED_RESPONSE,
    RESOURCE_ANY,
    TARGET_ALL_CARDS,
    TARGET_ALL_CHARACTERS,
    TARGET_CARD,
    TARGET_ENEMY,
    TARGET_PLAYER_EXTRA_DECK,
    TRAIT_AERIAL,
    TRAIT_SPELL,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_PHASE_ENDS,
    TRIGGER_ROUND_ENDS,
    TRIGGER_THIS_DEFEAT,
    TRIGGER_YOUR_SUPERHERO_GET_TRAITS,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {CancelCardEffectsEffect} from '../../src/effects/cancel-card-effects-effect.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {PlayPhaseEffect} from '../../src/effects/play-phase-effect.js';
import {PlayRoundEffect} from '../../src/effects/play-round-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {Engine} from '../../src/engine/engine.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {FaceDown} from '../../src/model/match/facedown.js';
import {Player} from '../../src/model/match/player.js';

const createDoctorStrange = async () => {
    const catalog = await loadCatalog();
    const hero = catalog.heroes.find(({_id}) => _id === 'doctor-strange');
    const aspectCards = new Map(catalog.aspects.map(record => [
        record._id,
        record.card,
    ]));
    const precon = hero.config.precon.flatMap(({cardRefs}) =>
        cardRefs.map(({id, count}) => ({
            card: aspectCards.get(id),
            count,
        })));
    const match = {
        triggerCards: {},
        players: [],
    };
    const factory = new MatchFactory(match);
    const superhero = factory.createSuperhero({
        ...hero.config,
        precon,
    });
    const player = new Player({
        name: 'Stephen',
        superhero,
        match,
    });
    match.players.push(player);
    player.initPlayer();
    player.getExtraDeck('invocation').refresh = async () => {};
    player.deck.refresh = async () => {};

    return {
        catalog,
        factory,
        hero,
        match,
        player,
    };
};

describe('Doctor Strange', () => {
    test('Contrahechizo configures generic card-effect cancellation for events', async () => {
        const {factory, hero, player} = await createDoctorStrange();
        const counterspellConfig = hero.config.nemesis.find(({card}) =>
            card.params.name === 'Contrahechizo');
        const counterspell = factory.cardsFactory.createGameCardFromConfig(
            counterspellConfig.card,
            {owner: player}
        );

        assert.equal(
            counterspellConfig.card.params.abilities[0].params.effect.params.effects[0].type,
            EFFECT_CANCEL_CARD_EFFECTS
        );
        assert.deepEqual(
            counterspellConfig.card.params.abilities[0].params.condition,
            {'effect.card.isEvent': true}
        );
        assert.ok(
            counterspell.abilities[0].effect.effects[0] instanceof
                CancelCardEffectsEffect
        );
    });

    test('Doctor Strange catalog includes a separate face-up Invocation deck', async () => {
        const {hero, player} = await createDoctorStrange();
        const invocationDeck = player.getExtraDeck('invocation');

        assert.ok(hero.config.extraDecks);
        assert.equal(hero.config.extraDecks[0].cards.length, 5);
        assert.deepEqual(
            hero.config.precon.map(({aspect}) => aspect),
            ['basic', 'protection'],
        );
        assert.ok(invocationDeck);
        assert.equal(invocationDeck.isPlayerExtraDeck, true);
        assert.equal(invocationDeck.topCardFaceUp, true);
        assert.equal(invocationDeck.hasDiscard, true);
        assert.equal(invocationDeck.cards.length, 5);
        assert.equal(invocationDeck.discardPile.length, 0);

        const serialized = player.toObj();
        assert.equal(
            serialized.extraDecks.invocation.topCard.id,
            invocationDeck.cards[0].id,
        );
        assert.deepEqual(serialized.extraDecks.invocation.discard, []);
    });

    test('Invocation deck cycles its own discard without touching the player deck', async () => {
        const {player} = await createDoctorStrange();
        const invocationDeck = player.getExtraDeck('invocation');
        const playerDeckCount = player.deck.cards.length;

        await invocationDeck.discardTopCards(invocationDeck.cards.length - 1);
        assert.equal(invocationDeck.cards.length, 1);
        assert.equal(invocationDeck.discardPile.length, 4);

        await invocationDeck.discardTopCards(1);
        assert.equal(invocationDeck.cards.length, 5);
        assert.equal(invocationDeck.discardPile.length, 0);
        assert.equal(player.deck.cards.length, playerDeckCount);
    });

    test('generic top-card effect can remove a card from a player auxiliary deck', async () => {
        const {factory, player} = await createDoctorStrange();
        const invocationDeck = player.getExtraDeck('invocation');
        const topCard = invocationDeck.cards[0];
        const getTopCard = factory.cardsFactory.abilitiesFactory.effectsFactory.createEffect({
            type: EFFECT_GET_TOP_CARD,
            params: {
                target: TARGET_PLAYER_EXTRA_DECK,
                deckId: 'invocation',
                remove: true,
            },
        });

        await getTopCard.runEffect({player});

        assert.equal(getTopCard.card, topCard);
        assert.equal(invocationDeck.cards.includes(topCard), false);
        assert.equal(invocationDeck.cards.length, 4);
    });

    test('generic discard-from-deck effect still discards the top card of an auxiliary deck', async () => {
        const {factory, player} = await createDoctorStrange();
        const invocationDeck = player.getExtraDeck('invocation');
        const topCard = invocationDeck.cards[0];
        const discardFromDeck = factory.cardsFactory.abilitiesFactory.effectsFactory.createEffect({
            type: EFFECT_DISCARD_FROM_DECK,
            params: {
                target: TARGET_PLAYER_EXTRA_DECK,
                deckId: 'invocation',
                count: 1,
                showDialog: false,
            },
        });

        await discardFromDeck.runEffect({player});

        assert.equal(invocationDeck.cards.includes(topCard), false);
        assert.equal(invocationDeck.discardPile.at(-1), topCard);
    });

    test('Dark Dimension portal returns its tucked Invocation card when defeated', async () => {
        const {factory, hero, match, player} = await createDoctorStrange();
        const invocationDeck = player.getExtraDeck('invocation');
        const topCard = invocationDeck.cards[0];
        const dialogs = [];
        const originalShuffle = invocationDeck.shuffle.bind(invocationDeck);
        let shuffleCount = 0;
        invocationDeck.shuffle = () => {
            shuffleCount += 1;

            return originalShuffle();
        };
        match.lasting = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);

            return {};
        };
        const portalConfig = hero.config.nemesis.find(({card}) =>
            card.params.name === 'Abrir un portal a la Dimensión Oscura');
        const portal = factory.cardsFactory.createGameCardFromConfig(
            portalConfig.card,
            {owner: player}
        );
        assert.equal(portalConfig.card.params.abilities.length, 1);
        assert.equal(portalConfig.card.params.abilities[0].type, ABILITY_WHEN_REVEALED);
        assert.equal(portal.abilities.length, 1);
        assert.equal(portal.abilities.some(ability => ability.isWhenDefeated), false);
        assert.equal(
            portal.abilities.every(ability =>
                ability.effect.effects.at(-1).effectType === EFFECT_LASTING),
            true
        );
        const originalSide = player.superhero.selectedSide;
        for (const side of [0, 1]) {
            player.superhero.selectedSide = side;
            assert.equal(portal.abilities[0].isValidIdentity({player}), true);
        }
        player.superhero.selectedSide = originalSide;
        portal.refresh = async () => {};
        portal.controller = player;

        const scenarioGameZone = {
            cards: [portal],
            async refresh() {},
            async discard(card) {
                this.cards = this.cards.filter(candidate => candidate !== card);
            },
        };
        const encounterDeck = {
            discardPile: [],
            async discard(card) {
                this.discardPile.push(card);
            },
            async refresh() {},
        };
        match.scenario = {
            deck: encounterDeck,
            gameZone: scenarioGameZone,
        };

        await portal.abilities[0].resolveAbility({
            card: portal,
            match,
            player,
        });
        assert.deepEqual(
            portal.faceDown.map(({card}) => card),
            [topCard]
        );
        assert.equal(invocationDeck.cards.includes(topCard), false);

        const [lasting] = match.lasting;
        assert.ok(lasting);
        assert.equal(lasting.card, portal);
        assert.equal(lasting.selectedTarget, portal);
        assert.equal(lasting.until, TRIGGER_THIS_DEFEAT);
        assert.equal(
            portal.triggers[TRIGGER_THIS_DEFEAT][PRIORITY_FORCED_RESPONSE]?.length ?? 0,
            0
        );
        assert.equal(
            portal.triggers[TRIGGER_THIS_DEFEAT][PRIORITY_FORCED_INTERRUPT]?.length,
            1
        );

        const defeat = new DefeatEffect({
            match,
            selectedTarget: portal,
        });
        await defeat.runEffect({match, player});

        assert.equal(portal.faceDown.length, 0);
        assert.equal(invocationDeck.cards.length, 5);
        assert.equal(invocationDeck.cards.filter(card => card === topCard).length, 1);
        assert.equal(shuffleCount, 1);
        assert.equal(dialogs.length, 0);
        assert.equal(match.lasting.includes(lasting), false);
    });

    test('ReturnFaceDownEffect can return a card to a configured auxiliary deck', async () => {
        const {factory, player} = await createDoctorStrange();
        const invocationDeck = player.getExtraDeck('invocation');
        const card = invocationDeck.cards.shift();
        const host = {
            faceDown: [],
            async refresh() {},
        };
        const faceDown = new FaceDown({
            attached: host,
            card,
        });
        host.faceDown.push(faceDown);
        const returnFaceDown = factory.cardsFactory.abilitiesFactory.effectsFactory.createEffect({
            type: EFFECT_RETURN_FACEDOWN,
            params: {
                selectedTarget: host,
                faceDownTarget: TARGET_ALL_CARDS,
                destination: {
                    target: TARGET_PLAYER_EXTRA_DECK,
                    deckId: 'invocation',
                    position: 'shuffle',
                },
            },
        });

        await returnFaceDown.runEffect({
            player,
            card: host,
        });

        assert.deepEqual(host.faceDown, []);
        assert.equal(invocationDeck.cards.includes(card), true);
    });

    test('Wong exposes both actions with descriptive menu names', async () => {
        const {player} = await createDoctorStrange();
        const wong = player.superhero.cards.find(card => card.name === 'Wong');

        assert.ok(wong);
        assert.deepEqual(
            wong.abilities
                .filter(ability => ability.isAction && !ability.isBasic)
                .map(ability => ability.name),
            [
                'Cura 1 de Daño a tu carta de Superhéroe',
                'Descarta la primera carta del mazo de Invocación',
            ],
        );
        assert.equal(
            wong.abilities.some(ability =>
                ability.trigger === TRIGGER_CARD_ENTER_PLAY),
            false
        );
    });

    test('Magic Domain pays the selected Invocation card cost', async () => {
        const {match, player} = await createDoctorStrange();
        const superhero = player.superhero;
        const heroSideIndex = superhero.sides.findIndex(side => side.isHero);
        superhero.selectedSide = heroSideIndex;
        const heroSide = superhero.currentSide;
        const invocationDeck = player.getExtraDeck('invocation');
        const topCardIndex = invocationDeck.cards.findIndex(card => card.cost > 0);
        const [topCard] = invocationDeck.cards.splice(topCardIndex, 1);
        invocationDeck.cards.unshift(topCard);

        heroSide.refresh = async () => {};
        player.gameZone.refresh = async () => {};
        let paidCard;
        let paidResources;
        player.spendResources = async (resources, card) => {
            paidCard = card;
            paidResources = resources;

            return {
                generators: [{
                    id: 'invocation-payment-generator',
                    abilities: [{
                        isResource: true,
                        resources,
                    }],
                    async resolveResourceAbility() {},
                }],
                hand: [],
                resources,
            };
        };

        const ability = heroSide.abilities.find(ability =>
            ability.name === 'Dominio de la magia');
        const paid = await ability.arrow.pay({
            card: superhero,
            match,
            player,
        });

        assert.equal(paid, true);
        assert.equal(paidCard, topCard);
        assert.deepEqual(paidResources, Array(topCard.cost).fill(RESOURCE_ANY));
    });

    test('Master of the Mystic Arts pays, resolves, and returns the top Invocation', async () => {
        const {factory, hero, match, player} = await createDoctorStrange();
        match.mc = {mcSocket: {send() {}}};
        const heroSideIndex = player.superhero.sides.findIndex(side => side.isHero);
        player.superhero.selectedSide = heroSideIndex;

        const invocationDeck = player.getExtraDeck('invocation');
        const topCardIndex = invocationDeck.cards.findIndex(card => card.cost > 0);
        const [invocation] = invocationDeck.cards.splice(topCardIndex, 1);
        assert.ok(invocation);
        assert.ok(invocation.cost > 0);
        invocationDeck.cards.unshift(invocation);

        const resource = player.deck.cards.find(card =>
            card.isResource && card.resources.length >= invocation.cost);
        assert.ok(resource);
        player.deck.cards.splice(player.deck.cards.indexOf(resource), 1);
        player.hand.addCard(resource);

        const maestroConfig = hero.config.cards.find(({card}) =>
            card.params.name === 'Maestro de las artes místicas');
        assert.ok(maestroConfig);
        const maestro = factory.cardsFactory.createGameCardFromConfig(
            maestroConfig.card,
            {owner: player}
        );
        maestro.controller = player;
        const maestroAbility = maestro.abilities[0];
        assert.equal(maestroAbility.arrow.cost.effectType, EFFECT_PAY_PRINTED_COST);
        assert.equal(
            maestroAbility.effect.effects[0].effectType,
            EFFECT_RESOLVE_SPECIAL_ABILITY
        );

        const resolutionOrder = [];
        const specialAbility = invocation.abilities[0];
        specialAbility.canRun = async () => true;
        specialAbility.resolveAbility = async () => {
            resolutionOrder.push('special');
            await invocationDeck.discardTopCards(1);
        };

        match.openDialog = async ({dialogType, data}) => {
            if (dialogType === DIALOG_PAY_COST) {
                resolutionOrder.push('payment');
                assert.equal(data.card.id, invocation.id);
                assert.equal(data.cost, invocation.cost);

                return {
                    paid: {
                        generators: [],
                        hand: [{id: resource.id}],
                    },
                    resources: resource.resources.slice(0, invocation.cost),
                };
            }
            if (dialogType === DIALOG_SELECT_CARD) {
                return {selected: [{id: data.cards[0].id}]};
            }

            throw new Error(`Unexpected dialog: ${dialogType}`);
        };

        await maestroAbility.resolveAbility({
            card: maestro,
            match,
            player,
        });

        assert.deepEqual(resolutionOrder, ['payment', 'special']);
        assert.equal(invocationDeck.cards[0], invocation);
        assert.equal(invocationDeck.discardPile.includes(invocation), false);
        assert.equal(invocationDeck.topCardFaceUp, true);
        assert.equal(
            player.toObj().extraDecks.invocation.topCard.id,
            invocation.id
        );
    });

    test('Bandas Carmesí de Cyttorak stuns and damages the same chosen enemy', async () => {
        const {match, player} = await createDoctorStrange();
        const invocation = player.getExtraDeck('invocation').cards.find(card =>
            card.name === 'Bandas Carmesí de Cyttorak');
        assert.ok(invocation);

        const enemies = ['enemy-one', 'enemy-two'].map((id, index) => ({
            id,
            isEnemy: true,
            isInPlay: true,
            isStunned: false,
            name: `Enemy ${index + 1}`,
            stun() {
                this.isStunned = true;
            },
            async refresh() {},
            toObj() {
                return {id: this.id, name: this.name};
            },
        }));
        match.enemies = enemies;

        const dialogs = [];
        match.openDialog = async ({dialogType, data}) => {
            dialogs.push({dialogType, data});

            return {selected: {id: enemies[1].id}};
        };

        const effect = invocation.abilities[0].effect;
        const [simultaneousEffect] = effect.effects;
        assert.equal(simultaneousEffect.effectType, EFFECT_SIMULTANEOUS);
        assert.equal(simultaneousEffect.target, TARGET_ENEMY);
        const stunEffect = simultaneousEffect.effects.find(({effectType}) =>
            effectType === EFFECT_STUN);
        const damageEffect = simultaneousEffect.effects.find(({effectType}) =>
            effectType === EFFECT_DEAL_DAMAGE);
        const damageEvents = [];

        damageEffect.execute = async function() {
            damageEvents.push({
                damage: this.damage,
                target: this.selectedTarget,
            });
        };
        effect.effects[1].execute = async () => {};

        await effect.runEffect({
            player,
            match,
            card: invocation,
            selectedCard: invocation,
            selectedCards: [invocation],
        });

        assert.equal(dialogs.length, 1);
        assert.equal(dialogs[0].dialogType, DIALOG_SELECT_TARGET);
        assert.deepEqual(dialogs[0].data.cards.map(({id}) => id), [
            'enemy-one',
            'enemy-two',
        ]);
        assert.strictEqual(stunEffect.selectedTarget, enemies[1]);
        assert.strictEqual(damageEvents[0].target, enemies[1]);
        assert.deepEqual(damageEvents.map(({damage}) => damage), [7]);
        assert.equal(enemies[0].isStunned, false);
        assert.equal(enemies[1].isStunned, true);
    });

    test('Cloak of Levitation can be played and grants Aerial', async () => {
        const {catalog, factory, match, player} = await createDoctorStrange();
        const superhero = player.superhero;
        superhero.selectedSide = superhero.sides.findIndex(side => side.isHero);
        match.initialPlayer = player;
        match.limits = {};
        match.isUniqueCard = () => false;
        match.enemies = [];
        match.schemes = [];
        match.mc = {
            mcSocket: {
                send() {},
            },
        };

        const cloak = player.deck.cards.find(card =>
            card.name === 'Capa de levitación');
        const resource = player.deck.cards.find(card =>
            card.isResource &&
            card.resources.length >= cloak.cost &&
            card.resources.every(resource => typeof resource === 'string'));
        assert.ok(resource);
        [cloak, resource].forEach(card => {
            player.deck.cards.splice(player.deck.cards.indexOf(card), 1);
            player.hand.addCard(card);
        });
        match.openDialog = async ({dialogType}) => {
            assert.equal(dialogType, DIALOG_PAY_COST);

            return {
                paid: {
                    generators: [],
                    hand: [{id: resource.id}],
                },
                resources: resource.resources.slice(0, cloak.cost),
            };
        };

        await player.playCard({
            cardId: cloak.id,
            abilityType: ABILITY_ACTION,
        });
        const serializedHero = await player.toObjWithPlayableHand();
        superhero.selectedSide = superhero.sides.findIndex(side => side.isAlterEgo);
        const serializedAlterEgo = await player.toObjWithPlayableHand();

        assert.deepEqual(player.gameZone.cards, [cloak]);
        assert.equal(cloak.isPlaying, false);
        assert.deepEqual(serializedHero.superhero.extraTraits, [TRAIT_AERIAL]);
        assert.deepEqual(serializedAlterEgo.superhero.extraTraits, [TRAIT_AERIAL]);
        assert.equal(cloak.abilities[0].effect.effectType, EFFECT_MODIFY_TRAITS);
        assert.equal(
            cloak.abilities[0].trigger,
            TRIGGER_YOUR_SUPERHERO_GET_TRAITS
        );

        const captainMarvel = catalog.heroes.find(({_id}) => _id === 'captain-marvel');
        const otherPlayer = new Player({
            name: 'Carol',
            superhero: factory.createSuperhero({
                ...captainMarvel.config,
                precon: [],
            }),
            match,
        });
        match.players.push(otherPlayer);
        otherPlayer.initPlayer();

        const otherTraits = await otherPlayer.superhero.getEffectiveTraits({
            player: otherPlayer,
        });
        assert.equal(otherTraits.includes(TRAIT_AERIAL), false);
    });

    test('Invocation resolution discards without showing a reveal dialog', async () => {
        const {match, player} = await createDoctorStrange();
        const invocationDeck = player.getExtraDeck('invocation');
        const invocationCardIndex = invocationDeck.cards.findIndex(card =>
            card.name === 'Imágenes de Ikonn');
        const [invocationCard] = invocationDeck.cards.splice(invocationCardIndex, 1);
        invocationDeck.cards.push(invocationCard);
        const topCardAfterShuffle = invocationDeck.cards[0];
        const discardEffect = invocationCard.abilities[0].effect.effects.at(-1);
        const dialogs = [];
        discardEffect.openDialog = async dialog => {
            dialogs.push(dialog);
        };
        discardEffect.selectedTarget = invocationDeck;

        await discardEffect.runEffect({
            match,
            player,
            selectedCard: invocationCard,
            selectedCards: [invocationCard],
        });

        assert.equal(discardEffect.showDialog, false);
        assert.deepEqual(dialogs, []);
        assert.equal(invocationDeck.cards.includes(invocationCard), false);
        assert.equal(invocationDeck.cards[0], topCardAfterShuffle);
        assert.equal(invocationDeck.discardPile.at(-1), invocationCard);
    });

    test('Sancta Sanctorum still draws when no Spell is in the discard pile', async () => {
        const {match, player} = await createDoctorStrange();
        const sanctum = player.superhero.cards.find(card =>
            card.name === 'Sancta Sanctorum');
        const initialHandSize = player.hand.cards.length;
        player.hand.refresh = async () => {};

        await sanctum.abilities[0].resolveAbility({
            arrowPaid: true,
            card: sanctum,
            match,
            player,
        });

        assert.equal(player.hand.cards.length, initialHandSize + 1);
        assert.equal(player.deck.discardPile.length, 0);
    });

    test('Sancta Sanctorum moves a selected Spell back into the deck', async () => {
        const {match, player} = await createDoctorStrange();
        const sanctum = player.superhero.cards.find(card =>
            card.name === 'Sancta Sanctorum');
        const spell = player.superhero.cards.find(card =>
            card.traits.includes(TRAIT_SPELL));
        player.deck.discardPile.push(spell);
        player.hand.refresh = async () => {};
        match.openDialog = async ({data}) => ({
            selected: data.cards[0],
        });

        await sanctum.abilities[0].resolveAbility({
            arrowPaid: true,
            card: sanctum,
            match,
            player,
        });

        assert.equal(player.deck.discardPile.includes(spell), false);
        assert.equal(player.deck.cards.includes(spell), true);
    });

    test('Siete Anillos de Raggador gives Tough to up to three characters', async () => {
        const {match, player} = await createDoctorStrange();
        const invocationDeck = player.getExtraDeck('invocation');
        const invocationCardIndex = invocationDeck.cards.findIndex(card =>
            card.name === 'Siete Anillos de Raggador');
        const [invocationCard] = invocationDeck.cards.splice(invocationCardIndex, 1);
        invocationDeck.cards.unshift(invocationCard);
        const [toughEffect] = invocationCard.abilities[0].effect.effects;
        const friendlyCharacters = Array.from({length: 3}, (_, index) => ({
            id: `friendly-${index}`,
            isTough: false,
            setTough() {
                this.isTough = true;
            },
            async refresh() {},
            toObj() {
                return {id: this.id};
            },
        }));
        const enemy = {
            id: 'enemy',
            isTough: false,
            setTough() {
                this.isTough = true;
            },
            async refresh() {},
            toObj() {
                return {id: this.id};
            },
        };
        match.friends = friendlyCharacters;
        match.enemies = [enemy];

        assert.equal(toughEffect.target, TARGET_ALL_CHARACTERS);
        assert.equal(toughEffect.selectUpTo, true);
        assert.equal(toughEffect.selectCount, 3);
        match.openDialog = async () => ({
            selected: [
                enemy,
                ...friendlyCharacters.slice(0, 2),
            ].map(({id}) => ({id})),
        });

        await invocationCard.abilities[0].resolveAbility({
            arrowPaid: true,
            card: invocationCard,
            match,
            player,
            selectedCard: invocationCard,
            selectedCards: [invocationCard],
        });

        assert.deepEqual(
            friendlyCharacters.map(character => character.isTough),
            [true, true, false],
        );
        assert.equal(enemy.isTough, true);
        assert.equal(invocationDeck.discardPile.at(-1), invocationCard);
    });

    test('Doctor Strange persistent obligation choice skips the optional flip and modifies the next event cost', async () => {
        const {match, player} = await createDoctorStrange();
        const {superhero} = player;
        superhero.selectedSide = superhero.sides.findIndex(side => side.isHero);
        match.lasting = [];
        match.limits = {};
        match.scenario = {
            deck: {
                discardPile: [],
                async discard(card) {
                    this.discardPile.push(card);
                },
                async refresh() {},
            },
            gameZone: {
                cards: [],
                discard(card) {
                    const index = this.cards.indexOf(card);
                    if (index > -1) {
                        this.cards.splice(index, 1);
                    }
                    card.endTriggers();
                },
            },
        };
        player.gameZone.refresh = async () => {};

        const obligation = superhero.obligations[0];
        obligation.owner = player;
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);

            if (dialog.dialogType === DIALOG_LIST) {
                return {selected: {id: '1.0'}};
            }

            throw new Error(`Unexpected dialog: ${dialog.dialogType}`);
        };

        await new PutPlayEffect({
            card: obligation,
            controller: player,
            match,
        }).runEffect({
            card: obligation,
            player,
        });

        assert.equal(superhero.isHero, true);
        assert.equal(player.gameZone.cards.includes(obligation), true);
        assert.equal(match.lasting.length, 1);
        assert.equal(
            player.gameZone.toObj().cards.find(card => card.id === obligation.id).isObligation,
            true
        );
        assert.deepEqual(dialogs.map(dialog => dialog.dialogType), [DIALOG_LIST]);

        const event = player.deck.cards.find(card => card.isEvent);
        const playCardEffect = new PlayCardEffect({
            card: event,
            match,
        });
        await playCardEffect.triggerInit(
            playCardEffect.getTriggersParams({
                card: event,
                player,
            })
        );

        assert.equal(playCardEffect.modifyCost, 3);
        const resourceCost = await playCardEffect.getResourceCost({
            card: event,
            player,
        });
        assert.equal(resourceCost.amount, event.cost + 3);
        assert.equal(player.gameZone.cards.includes(obligation), true);

        const phase = new PlayPhaseEffect({match});
        phase.resolved = true;
        await phase.triggerEnds(
            {player},
            {triggerTypes: [TRIGGER_PHASE_ENDS]}
        );

        assert.equal(player.gameZone.cards.includes(obligation), true);
        assert.equal(match.lasting.length, 1);

        const nonEvent = {
            currentSide: {abilities: []},
            id: 'non-event-card',
            isEvent: false,
            owner: player,
        };
        const nonEventPlay = new PlayCardEffect({
            card: nonEvent,
            match,
        });
        nonEventPlay.resolved = true;
        await nonEventPlay.triggerEnds(
            nonEventPlay.getTriggersParams({
                card: nonEvent,
                player,
            })
        );

        assert.equal(player.gameZone.cards.includes(obligation), true);
        assert.equal(match.lasting.length, 1);

        playCardEffect.resolved = true;
        await playCardEffect.triggerEnds(
            playCardEffect.getTriggersParams({
                card: event,
                player,
            })
        );

        assert.equal(player.gameZone.cards.includes(obligation), false);
        assert.equal(match.scenario.deck.discardPile.includes(obligation), true);
        assert.equal(match.lasting.length, 0);
    });

    test('Doctor Strange fixed, Invocation, nemesis, and precon abilities compile', async () => {
        const {player} = await createDoctorStrange();
        const cards = [
            ...player.superhero.cards,
            ...player.superhero.extraDecks.flatMap(({cards: extraCards}) => extraCards),
            ...player.superhero.nemesis,
            ...player.superhero.deck,
        ];
        const abilities = cards.flatMap(card => card.abilities || []);

        assert.equal(player.superhero.nemesis.filter(card => card.isMinion).length, 1);
        assert.ok(player.superhero.nemesis.find(card =>
            card.isMinion && card.card.nemesis === true));
        const obligation = player.superhero.obligations[0];
        const resolutionAbility = obligation.abilities.find(ability =>
            ability.name === 'Resolver la obligación');
        const persistentOption = resolutionAbility.effect.options[1].effect;
        assert.equal(persistentOption.target, TARGET_CARD);
        assert.equal(persistentOption.endEffect.target, TARGET_CARD);
        const innateTalent = player.superhero.sides
            .find(side => side.isAlterEgo)
            .abilities.find(ability => ability.name === 'Talento Innato');
        assert.equal(innateTalent.effect.showDialog, false);
        assert.ok(abilities.length > 0);
        assert.ok(abilities.every(ability =>
            !ability.effect || typeof ability.effect.canRun === 'function'));
    });

    test('Magical Enhancements is discarded by its forced interrupt at round end', async () => {
        const {factory, hero, match, player} = await createDoctorStrange();
        const enhancementConfig = hero.config.cards.find(({card}) =>
            card.params.name === 'Mejoras mágicas');
        assert.ok(enhancementConfig);

        const enhancement = factory.cardsFactory.createGameCardFromConfig(
            enhancementConfig.card,
            {owner: player}
        );
        const dialogs = [];
        player.gameZone.refresh = async () => {};
        player.deck.refresh = async () => {};
        match.isUniqueCard = () => false;
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            assert.equal(dialog.dialogType, DIALOG_USE_CARD);

            return {selected: {id: enhancement.id}};
        };

        await new PutPlayEffect({
            card: enhancement,
            controller: player,
            match,
        }).runEffect({
            card: enhancement,
            player,
        });

        assert.equal(
            enhancement.triggers[TRIGGER_ROUND_ENDS][PRIORITY_FORCED_INTERRUPT].length,
            1
        );

        const round = new PlayRoundEffect({match});
        const previousRound = Engine.currentRound;
        match.limits = {};
        match.playing = true;
        match.persist = async () => {};
        match.refresh = async () => {};
        round.playersPhase.runEffect = async () => {};
        round.villainPhase.runEffect = async () => {};

        try {
            await round.runEffect({player});
        } finally {
            Engine.currentRound = previousRound;
        }

        assert.equal(match.phase, 'round-complete');
        assert.equal(player.gameZone.cards.includes(enhancement), false);
        assert.equal(player.deck.discardPile.includes(enhancement), true);
        assert.deepEqual(dialogs.map(({dialogType}) => dialogType), [DIALOG_USE_CARD]);
    });
});
