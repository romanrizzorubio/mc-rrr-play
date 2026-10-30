import assert from 'node:assert/strict';
import {describe, test} from 'node:test';
import {CARD_TYPE_MINION, CARD_TYPE_RESOURCE, CARD_TYPE_TREACHERY, DIALOG_DISCARD_HAND, DIALOG_SELECT_TARGET} from 'mc-shared';
import captainAmerica from '../../../mc-data/seed/catalog/heroes/captain-america.js';
import rhino from '../../../mc-data/seed/catalog/scenarios/rhino.js';
import {AttackBasicAbility} from '../../src/abilities/basic/attack-basic-ability.js';
import {AttachEffect} from '../../src/effects/attach-effect.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {EngageEffect} from '../../src/effects/engage-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

describe('Rhino armor before Tough', () => {
    const createGame = async ({extraTarget = false, selectBoth = false} = {}) => {
        const match = new Match({name: 'rhino-armor', mc: {mcSocket: {send() {}}}});
        match.persist = async () => {};
        match.refresh = async () => {};
        match.skipDiscardOrderDialog = true;
        match.openDialog = async () => ({});
        const factory = new MatchFactory(match);
        const player = match.createPlayer({
            name: 'Captain America player', initial: true,
            superhero: factory.createSuperhero({
                ...captainAmerica.config, cards: [], precon: [], nemesis: [], obligation: undefined,
            }),
        });
        player.initPlayer();
        player.superhero.selectedSide = 1;
        match.currentPlayer = player;
        match.currentTurnPlayer = player;
        match.scenario = await factory.createScenario({
            ...rhino.config, sets: [], defaultSets: [], cards: [],
        });
        await match.scenario.initScenario([], false);
        match.phase = 'players';
        match.playing = true;
        player.deck.cards = [factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE, params: {name: 'Remaining player card'},
        }, {owner: player})];
        match.scenario.deck.cards = [factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_TREACHERY, params: {name: 'Remaining encounter', boost: 0},
        }, {owner: match.scenario})];
        const villain = match.villain;
        villain.tough = 1;
        const armor = factory.cardsFactory.createGameCardFromConfig(
            rhino.config.cards.find(({card}) => card.params.name === 'Piel blindada del Rino').card,
            {owner: match.scenario},
        );
        await new AttachEffect({card: armor, match, selectedTarget: villain}).runEffect({player});
        await armor.initTriggers();
        const shield = factory.cardsFactory.createGameCardFromConfig(
            captainAmerica.config.cards.find(({card}) => card.params.name === 'Escudo del Capitán América').card,
            {owner: player},
        );
        await new PutPlayEffect({card: shield, match, selectedTarget: player}).runEffect({player});
        const event = factory.cardsFactory.createGameCardFromConfig(
            captainAmerica.config.cards.find(({card}) => card.params.name === 'Lanzamiento de escudo').card,
            {owner: player},
        );
        const targets = [villain];
        if (extraTarget) {
            const minion = factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_MINION,
                params: {name: 'Other minion', hitPoints: 10, attack: 1, scheme: 1},
            }, {owner: match.scenario});
            await new EngageEffect({
                card: minion, match, selectedTarget: player, controller: match.scenario,
            }).runEffect({player});
            targets.push(minion);
        }
        const selectedTargets = selectBoth ? targets : [villain];
        const discardedCards = selectedTargets.map((_, index) =>
            factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_RESOURCE, params: {name: `Discarded card ${index}`},
            }, {owner: player}));
        player.hand.cards.push(event, ...discardedCards);
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_DISCARD_HAND) {
                return {selected: discardedCards.map(card => ({id: card.id}))};
            }
            if (dialog.dialogType === DIALOG_SELECT_TARGET) {
                return {selected: dialog.data.count === undefined ?
                    {id: selectedTargets[0].id} :
                    selectedTargets.map(target => ({id: target.id}))};
            }
            return {};
        };
        return {armor, event, match, player, shield, targets: selectedTargets, villain, discardedCards};
    };

    test('a basic attack followed by actual Shield Toss removes the armor without removing Tough', async () => {
        const {armor, event, match, player, shield, villain, discardedCards} = await createGame({extraTarget: true});
        const basic = new AttackBasicAbility({card: player.superhero.currentSide, match});
        await basic.resolveAbility({
            player, card: player.superhero.currentSide, selectedTarget: villain, preselectedTarget: true,
        });
        assert.equal(player.superhero.exhausted, true);
        const basicDamage = await player.superhero.getAttackValue({player});
        assert.equal(armor.damage, basicDamage);
        assert.equal(villain.tough, 1);
        assert.equal(villain.damage, 0);
        await event.abilities[0].resolveAbility({player, card: event});
        assert.equal(villain.tough, 1);
        assert.equal(villain.damage, 0);
        assert.ok(match.scenario.deck.discardPile.includes(armor));
        assert.ok(!villain.attached.includes(armor));
        assert.ok(player.hand.cards.includes(shield));
        assert.ok(player.deck.discardPile.includes(discardedCards[0]));
        await new DealDamageEffect({
            match, selectedTarget: villain, damage: 1, isAttack: true, character: player.superhero,
        }).runEffect({player});
        assert.equal(villain.tough, 0);
        assert.equal(villain.damage, 0);
    });

    test('Shield Toss with one selected enemy puts four damage on armor and preserves Tough', async () => {
        const {armor, event, player, villain} = await createGame({extraTarget: true});
        await event.abilities[0].resolveAbility({player, card: event});
        assert.equal(armor.damage, 4);
        assert.equal(villain.tough, 1);
        assert.equal(villain.damage, 0);
        assert.ok(villain.attached.includes(armor));
    });

    for (const rhinoFirst of [true, false]) {
        test(`Shield Toss prevents only Rhino damage with Rhino ${rhinoFirst ? 'first' : 'last'}`, async () => {
            const {armor, event, player, targets, villain} = await createGame({extraTarget: true, selectBoth: true});
            const minion = targets[1];
            if (!rhinoFirst) {
                targets.reverse();
            }
            await event.abilities[0].resolveAbility({player, card: event});
            assert.equal(armor.damage, 4);
            assert.equal(villain.tough, 1);
            assert.equal(villain.damage, 0);
            assert.equal(minion.damage, 4);
        });
    }

    test('each target retains its own incoming damage and prevention amounts', async () => {
        const {armor, match, player, targets, villain} = await createGame({extraTarget: true, selectBoth: true});
        const minion = targets[1];
        await new DealDamageEffect({
            match, selectedTarget: [minion, villain], damage: [3, 2],
            isAttack: true, character: player.superhero,
        }).runEffect({player});
        assert.equal(armor.damage, 2);
        assert.equal(villain.tough, 1);
        assert.equal(villain.damage, 0);
        assert.equal(minion.damage, 3);
    });

    test('Rhino armor does not prevent another selected enemy from resolving its own Tough', async () => {
        const {armor, event, player, targets, villain} = await createGame({extraTarget: true, selectBoth: true});
        const minion = targets[1];
        minion.tough = 1;
        await event.abilities[0].resolveAbility({player, card: event});
        assert.equal(armor.damage, 4);
        assert.equal(villain.tough, 1);
        assert.equal(villain.damage, 0);
        assert.equal(minion.tough, 0);
        assert.equal(minion.damage, 0);
    });

    test('an ordinary attack with no armor removes Tough before placing damage', async () => {
        const {armor, match, player, villain} = await createGame();
        await armor.discard();
        await new DealDamageEffect({
            match, selectedTarget: villain, damage: 4, isAttack: true, character: player.superhero,
        }).runEffect({player});
        assert.equal(villain.tough, 0);
        assert.equal(villain.damage, 0);
    });
});
