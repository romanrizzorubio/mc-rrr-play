import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_RESOURCE,
    RESOURCE_WILD,
} from 'mc-shared';
import antMan from '../../../mc-data/seed/catalog/heroes/ant-man.js';
import sheHulk from '../../../mc-data/seed/catalog/heroes/she-hulk.js';
import underAttack from '../../../mc-data/seed/catalog/sets/under-attack.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

describe('scenario ability availability player', () => {
    const createContext = async () => {
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'scenario-ability-availability',
        });
        const factory = new MatchFactory(match);
        const createPlayer = (heroConfig, name, userId, initial, isHero) => {
            const superhero = factory.createSuperhero({
                ...heroConfig.config,
                cards: [],
                precon: [],
                nemesis: [],
                obligation: undefined,
            });
            const sideIndex = superhero.sides.findIndex(side =>
                Boolean(side.isAlterEgo) === !isHero);
            assert.notEqual(sideIndex, -1);
            superhero.selectedSide = sideIndex;
            superhero.setExhausted(false);

            const player = match.createPlayer({
                name,
                userId,
                superhero,
                initial,
            });
            player.initPlayer();
            player.toObjWithPlayableHand = async () => ({});

            return player;
        };
        const antManPlayer = createPlayer(
            antMan,
            'Ant-Man',
            'ant-man-user',
            true,
            false
        );
        const sheHulkPlayer = createPlayer(
            sheHulk,
            'Hulka',
            'she-hulk-user',
            false,
            true
        );
        const armorConfig = underAttack.config.cards.find(({card}) =>
            card.params.name === 'Armadura de Vibránium').card;
        const scenario = {
            toObj: () => ({}),
            async toObjWithAbilityAvailability(player) {
                const serializedArmor =
                    await armor.toObjWithAbilityAvailability(player);

                return {
                    villain: {
                        attached: [serializedArmor],
                    },
                };
            },
        };
        match.scenario = scenario;
        const armor = factory.cardsFactory.createGameCardFromConfig(
            armorConfig,
            {owner: scenario}
        );
        armor.controller = scenario;
        armor.attachedTo = {name: 'Villano'};
        for (let index = 0; index < 2; index++) {
            const resource = factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_RESOURCE,
                params: {
                    name: `Recurso universal ${index + 1}`,
                    resources: [RESOURCE_WILD],
                },
            }, {owner: sheHulkPlayer});
            sheHulkPlayer.hand.cards.push(resource);
        }
        match.toObj = () => ({});
        match.phase = 'players';

        return {match, antManPlayer, sheHulkPlayer};
    };

    const getArmorAction = async match => {
        const snapshot = await match.toObjWithPlayableHands();

        return snapshot.scenario.villain.attached[0].abilities[1];
    };

    test('evaluates scenario actions for the player whose turn is active', async () => {
        const {match, antManPlayer, sheHulkPlayer} = await createContext();

        match.currentTurnPlayer = antManPlayer;
        assert.equal((await getArmorAction(match)).disable, true);

        match.currentTurnPlayer = sheHulkPlayer;
        const action = await getArmorAction(match);

        assert.equal(sheHulkPlayer.superhero.isHero, true);
        assert.equal(sheHulkPlayer.superhero.exhausted, false);
        assert.equal(sheHulkPlayer.hand.cards.length, 2);
        assert.equal(action.disable, false);
    });

    test('evaluates an accepted action request for its target player', async () => {
        const {match, antManPlayer, sheHulkPlayer} = await createContext();

        match.currentTurnPlayer = antManPlayer;
        match.actionRequest = {
            requesterId: antManPlayer.id,
            targetId: sheHulkPlayer.id,
            status: 'accepted',
        };

        const action = await getArmorAction(match);

        assert.equal(action.disable, false);
    });

    test('keeps the active turn player as context while a request is pending', async () => {
        const {match, antManPlayer, sheHulkPlayer} = await createContext();

        match.currentTurnPlayer = antManPlayer;
        match.actionRequest = {
            requesterId: antManPlayer.id,
            targetId: sheHulkPlayer.id,
            status: 'pending',
        };

        const action = await getArmorAction(match);

        assert.equal(action.disable, true);
    });
});
