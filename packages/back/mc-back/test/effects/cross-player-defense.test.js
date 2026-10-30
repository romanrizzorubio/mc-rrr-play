import assert from 'node:assert/strict';
import {describe, test} from 'node:test';
import {CARD_TYPE_ALLY, CARD_TYPE_RESOURCE, DIALOG_DEFENSE, DIALOG_ENCOUNTERS_REVEAL, RESOURCE_ENERGY} from 'mc-shared';
import captainMarvel from '../../../mc-data/seed/catalog/heroes/captain-marvel.js';
import spiderman from '../../../mc-data/seed/catalog/heroes/spiderman.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';
import {Deck} from '../../src/model/match/deck.js';

describe('requesting another hero to defend an enemy attack', () => {
    const createGame = ({sameAccount = false, overkill = false} = {}) => {
        const match = new Match({name: 'cross-player-defense', mc: {mcSocket: {send() {}}}});
        match.scenario = {amplificationIcons: 0, gameZone: {cards: [], inPlayCards: []}};
        const factory = new MatchFactory(match);
        const players = [captainMarvel, spiderman].map((config, index) => {
            const superhero = factory.createSuperhero({
                ...config.config, cards: [], precon: [], obligation: undefined, nemesis: [],
            });
            superhero.selectedSide = superhero.sides.findIndex(side => side.isHero);
            const player = match.createPlayer({
                id: `seat-${index}`, name: `Player ${index}`,
                userId: sameAccount ? 'shared-account' : `account-${index}`,
                superhero, initial: index === 0,
            });
            player.gameZone = new PlayerZone({owner: player});
            player.deck = new Deck({owner: player, isPlayerDeck: true});
            player.deck.cards.push(factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_RESOURCE, params: {name: 'Resource', resources: [RESOURCE_ENERGY]},
            }));
            player.hand.refresh = async () => {};
            superhero.refresh = async () => {};
            player.gameZone.refresh = async () => {};
            return player;
        });
        const enemy = {
            id: 'enemy', name: 'Enemy', isMinion: true, isInPlay: true,
            getAttackValue: async () => 5,
            toObj: () => ({id: 'enemy', name: 'Enemy', image: 'enemy.png', attack: 5}),
        };
        const attack = new EnemyAttackEffect({
            enemy, match, selectedTarget: players[0], keywords: {overkill},
        });
        const boostPlayers = [];
        const boost = {
            boost: 1, isInPlay: true,
            toObj: () => ({id: 'boost', name: 'Boost', boost: 1}),
            boostAbility: {resolveAbility: async params => {
                boostPlayers.push({player: params.player.id, target: params.effect.selectedTarget.id});
            }},
        };
        attack.dealBoostCards = async () => { attack.boostCards = [boost]; };
        attack.showBoostCards = async () => {};
        const ally = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {name: 'Defending ally', hitPoints: 3, attack: 1, thwart: 1, cost: 0},
        });
        ally.owner = players[1];
        ally.controller = players[1];
        players[1].gameZone.cards.push(ally);
        ally.refresh = async () => {};
        const dialogs = [];
        return {ally, attack, boostPlayers, dialogs, enemy, factory, match, players};
    };

    for (const sameAccount of [false, true]) {
        test(`an accepted hero defense redirects damage, boosts and later triggers (${sameAccount ? 'shared' : 'different'} account)`, async () => {
            const {attack, boostPlayers, dialogs, match, players} = createGame({sameAccount});
            const originalLife = await players[0].getLife();
            const defenderLife = await players[1].getLife();
            const params = {player: players[0], match};
            match.openDialog = async dialog => {
                dialogs.push(dialog);
                if (dialog.dialogType === DIALOG_ENCOUNTERS_REVEAL) {
                    assert.equal(dialog.targetPlayer.id, players[1].id);
                    return {};
                }
                assert.equal(dialog.dialogType, DIALOG_DEFENSE);
                if (dialog.targetPlayer === players[0]) {
                    assert.deepEqual(dialog.data.players.map(player => player.id), [players[1].id]);
                    assert.ok(dialog.data.players[0].image);
                    return {defendingPlayerId: players[1].id};
                }
                assert.equal(dialog.targetPlayer.id, players[1].id);
                assert.equal(dialog.data.players, undefined, 'requests cannot cascade to a third player');
                assert.ok(dialog.data.defenders.every(card =>
                    players[1].defenders.some(defender => defender.id === card.id)));
                return {defender: dialog.data.defenders.find(card => card.id === players[1].superhero.id)};
            };
            await attack.execute(params);
            assert.equal(attack.defender, players[1].superhero.currentSide);
            assert.equal(attack.selectedTarget.id, players[1].id);
            assert.equal(attack.defValue, await players[1].superhero.getDefenseValue({player: players[1]}));
            assert.equal(players[1].superhero.exhausted, true);
            assert.equal(players[0].superhero.exhausted, false);
            assert.equal(await players[0].getLife(), originalLife);
            assert.equal(await players[1].getLife(), defenderLife - (6 - attack.defValue));
            assert.deepEqual(boostPlayers, [{player: players[1].id, target: players[1].id}]);
            assert.equal(attack.getTriggersParams(params).player.id, players[1].id);
            assert.equal(params.player.id, players[0].id, 'the initiating context is not mutated');
            assert.equal(attack.canUseDefenseAbility(players[0]), false);
            assert.equal(dialogs.filter(dialog => dialog.dialogType === DIALOG_DEFENSE).length, 2);
        });
    }

    test('declining returns to the original player without changing or exhausting any defender', async () => {
        const {attack, dialogs, match, players} = createGame({sameAccount: true});
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            assert.equal(attack.selectedTarget.id, players[0].id);
            assert.equal(attack.isDefended, false);
            assert.equal(players[1].superhero.exhausted, false);
            if (dialogs.length === 1) {
                return {defendingPlayerId: players[1].id};
            }
            if (dialogs.length === 2) {
                return {defender: null};
            }
            assert.equal(dialog.targetPlayer.id, players[0].id);
            return {defender: dialog.data.defenders[0]};
        };
        await attack.defense({player: players[0]});
        assert.deepEqual(dialogs.map(dialog => dialog.targetPlayer.id),
            [players[0].id, players[1].id, players[0].id]);
        assert.equal(attack.defender, players[0].superhero.currentSide);
        assert.equal(players[0].superhero.exhausted, true);
        assert.equal(players[1].superhero.exhausted, false);
    });

    test('another player can defend with an ally in alter-ego form and receives the overkill damage', async () => {
        const {ally, attack, match, players} = createGame({overkill: true});
        players[1].superhero.selectedSide = players[1].superhero.sides.findIndex(side => side.isAlterEgo);
        const originalLife = await players[0].getLife();
        const defenderLife = await players[1].getLife();
        match.openDialog = async dialog => {
            if (dialog.dialogType !== DIALOG_DEFENSE) {
                assert.equal(ally.exhausted, true);
                return {};
            }
            return dialog.targetPlayer === players[0] ?
                {defendingPlayerId: players[1].id} :
                {defender: dialog.data.defenders.find(card => card.id === ally.id)};
        };
        await attack.execute({player: players[0], match});
        assert.equal(attack.defValue, 0, 'an ally does not subtract hero DEF');
        assert.ok(players[1].deck.discardPile.includes(ally));
        assert.equal(await players[0].getLife(), originalLife);
        assert.equal(await players[1].getLife(), defenderLife - 3);
        assert.equal(attack.selectedTarget.id, players[1].id);
    });

    test('an ally removed by a boost leaves the attack undefended against its defending player', async () => {
        const {ally, attack, match, players} = createGame();
        const originalLife = await players[0].getLife();
        const defenderLife = await players[1].getLife();
        match.openDialog = async dialog => {
            if (dialog.dialogType !== DIALOG_DEFENSE) {
                return {};
            }
            return dialog.targetPlayer === players[0] ?
                {defendingPlayerId: players[1].id} :
                {defender: {id: ally.id}};
        };
        await attack.dealBoostCards();
        attack.boostCards[0].boostAbility.resolveAbility = async () => ally.discard();
        attack.dealBoostCards = async () => {};
        await attack.execute({player: players[0]});
        assert.equal(await players[0].getLife(), originalLife);
        assert.equal(await players[1].getLife(), defenderLife - 6);
        assert.equal(attack.isDefended, false);
        assert.equal(attack.canUseDefenseAbility(players[0]), false);
        assert.deepEqual(attack.getOtherDefendingPlayers(players[1]), []);
        assert.equal(attack.attacked.id, players[1].id);
        assert.equal(attack.getTriggersParams({player: players[0]}).player.id, players[1].id);
        assert.ok(players[1].deck.discardPile.includes(ally));
    });

    test('a requested defense redirects only its own target in a multi-target attack', async () => {
        const {attack, match, players} = createGame();
        const originalLife = await players[0].getLife();
        const defenderLife = await players[1].getLife();
        attack.selectedTarget = [...players];
        let selections = 0;
        match.openDialog = async dialog => {
            if (dialog.dialogType !== DIALOG_DEFENSE) {
                return {};
            }
            selections++;
            if (selections === 1) {
                assert.equal(dialog.targetPlayer.id, players[0].id);
                return {defendingPlayerId: players[1].id};
            }
            assert.equal(dialog.targetPlayer.id, players[1].id);
            return selections === 2 ?
                {defender: {id: players[1].superhero.id}} : {};
        };
        await attack.execute({player: players[0]});
        assert.equal(selections, 3);
        assert.equal(await players[0].getLife(), originalLife);
        assert.equal(await players[1].getLife(), defenderLife - 9);
        assert.equal(attack.defenseValues.get(players[0]), 3);
        assert.equal(attack.attacked[0].id, players[1].superhero.currentSide.id);
        assert.equal(attack.attacked[1].id, players[1].id);
    });

    test('an already established defense disallows requests to any other player', async () => {
        const {attack, match, players} = createGame();
        await attack.setDefenderByAbility(players[0], {player: players[0]});
        match.openDialog = async dialog => {
            assert.equal(dialog.data.players, undefined);
            return {defender: null};
        };
        await attack.defense({player: players[0]});
        assert.equal(attack.defender, players[0].superhero.currentSide);
        assert.equal(attack.defValue, 0, 'a defense ability alone does not subtract basic DEF');
        assert.equal(players[0].superhero.exhausted, false);
        assert.deepEqual(attack.getOtherDefendingPlayers(players[0]), []);
    });

    test('an attacked exhausted hero still gets the option to request another player', async () => {
        const {attack, match, players} = createGame();
        players[0].superhero.exhausted = true;
        let requests = 0;
        match.openDialog = async dialog => {
            requests++;
            if (dialog.targetPlayer === players[0]) {
                assert.deepEqual(dialog.data.defenders, []);
                return {defendingPlayerId: players[1].id};
            }
            return {defender: dialog.data.defenders[0]};
        };
        await attack.defense({player: players[0]});
        assert.equal(requests, 2);
        assert.equal(attack.defender, players[1].superhero.currentSide);
    });

    test('requests offer only players with at least one currently eligible defender', async () => {
        for (const configuration of [
            {heroExhausted: true, allyExhausted: true, eligible: false},
            {alterEgo: true, allyExhausted: true, eligible: false},
            {defeated: true, eligible: false},
            {heroExhausted: true, allyExhausted: false, eligible: true},
            {alterEgo: true, allyExhausted: false, eligible: true},
            {heroExhausted: false, allyExhausted: true, eligible: true},
        ]) {
            const {ally, attack, match, players} = createGame({sameAccount: true});
            players[1].superhero.exhausted = configuration.heroExhausted ?? false;
            ally.exhausted = configuration.allyExhausted ?? false;
            players[1].defeated = configuration.defeated ?? false;
            if (configuration.alterEgo) {
                players[1].superhero.selectedSide =
                    players[1].superhero.sides.findIndex(side => side.isAlterEgo);
            }
            let selections = 0;
            match.openDialog = async dialog => {
                selections++;
                assert.equal(dialog.targetPlayer.id, players[0].id);
                assert.deepEqual((dialog.data.players || []).map(player => player.id),
                    configuration.eligible ? [players[1].id] : []);
                return {defender: null};
            };
            await attack.defense({player: players[0]});
            assert.equal(selections, 1);
        }
    });

    test('mandatory defender conditions also apply to the requested player, who may still decline', async () => {
        const {ally, attack, factory, match, players} = createGame();
        const originalAlly = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {name: 'Original ally', hitPoints: 3, attack: 1, thwart: 1, cost: 0},
        });
        originalAlly.owner = players[0];
        originalAlly.controller = players[0];
        players[0].gameZone.cards.push(originalAlly);
        attack.addDefenderCondition({isAlly: true});
        let requests = 0;
        match.openDialog = async dialog => {
            requests++;
            if (requests === 1) {
                assert.equal(dialog.hideOk, true);
                return {defendingPlayerId: players[1].id};
            }
            if (requests === 2) {
                assert.equal(dialog.hideOk, false);
                assert.deepEqual(dialog.data.defenders.map(card => card.id), [ally.id]);
                return {defender: null};
            }
            assert.equal(dialog.targetPlayer.id, players[0].id);
            assert.equal(dialog.hideOk, true);
            return {defender: null};
        };
        await assert.rejects(attack.defense({player: players[0]}), /qualifying defender/);
        assert.equal(attack.isDefended, false);
    });

    test('invalid requests and cross-player card selections are rejected explicitly', async () => {
        for (const response of [
            {defendingPlayerId: 'missing'},
            {defendingPlayerId: 'seat-0'},
            {defender: {id: 'foreign-card'}},
        ]) {
            const {attack, match, players} = createGame();
            match.openDialog = async () => response;
            await assert.rejects(attack.defense({player: players[0]}), /no es válido/);
            assert.equal(attack.isDefended, false);
        }
    });
});
