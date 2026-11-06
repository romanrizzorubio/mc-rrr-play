import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_FORCED_RESPONSE,
} from 'mc-shared';
import {Ability} from '../../src/abilities/core/ability.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {McSocket} from '../../src/server/socket/mc-socket.js';
import {Match} from '../../src/model/match/match.js';

describe('Peril resolution', () => {
    function createMatch() {
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'peril-test',
        });
        match.players = [
            {
                id: 'resolving-player',
                isPlayer: true,
                name: 'Resolving player',
                userId: 'resolving-user',
            },
            {
                id: 'other-player',
                isPlayer: true,
                name: 'Other player',
                userId: 'other-user',
            },
        ];

        return match;
    }

    function createPerilCard() {
        return {
            isEncounterCard: true,
            isTreachery: true,
            name: 'Peril treachery',
            peril: true,
            toObj() {
                return {name: this.name};
            },
        };
    }

    test('blocks chat before the reveal dialog and restores it after resolution', async () => {
        const match = createMatch();
        const [player] = match.players;
        const otherPlayer = match.players[1];
        const card = createPerilCard();
        match.chatMessages.push({
            id: 'before-peril',
            text: 'Previous message',
        });
        const effect = new RevealEncounterEffect({
            card,
            match,
            player,
        });
        effect.openPublicDialog = async () => {
            assert.equal(match.isResolvingPeril, true);
            assert.deepEqual(match.getChatState(), {
                enabled: false,
                messages: [],
            });
            assert.throws(
                () => match.addChatMessage({text: 'blocked'}),
                /chat está deshabilitado/u
            );
        };
        effect.triggerWould = async () => {
            assert.equal(match.isPlayerRestrictedByPeril(otherPlayer), true);

            return true;
        };
        effect.triggerInit = async () => true;
        effect.execute = async () => {
            assert.equal(match.isResolvingPeril, true);
        };
        effect.triggerEnds = async () => true;

        await effect.runEffect({player});

        assert.equal(match.isResolvingPeril, false);
        assert.deepEqual(match.getChatState(), {
            enabled: true,
            messages: match.chatMessages,
        });
    });

    test('blocks other players optional abilities but keeps forced abilities available', async () => {
        const match = createMatch();
        const [player, otherPlayer] = match.players;
        const card = createPerilCard();
        const resolution = match.beginPerilResolution(player, card);
        const optionalAbility = new Ability({match});
        optionalAbility.isAction = true;
        const forcedAbility = new Ability({
            abilityType: ABILITY_FORCED_RESPONSE,
            match,
        });

        assert.equal(await optionalAbility.canRun({player}), true);
        assert.equal(await optionalAbility.canRun({player: otherPlayer}), false);
        assert.equal(await forcedAbility.canRun({player: otherPlayer}), true);

        const cardAbility = new Ability({match});
        cardAbility.card = {
            controller: {isPlayer: false},
            isInPlay: true,
            peril: true,
            perilPlayer: player,
        };
        cardAbility.isAction = true;
        match.endPerilResolution(resolution);

        assert.equal(await cardAbility.canRun({player}), true);
        assert.equal(await cardAbility.canRun({player: otherPlayer}), false);
    });

    test('rejects socket chat sends while Peril is active', () => {
        const match = createMatch();
        const [player] = match.players;
        const resolution = match.beginPerilResolution(player, createPerilCard());
        const socketServer = new McSocket({
            getMatch: () => match,
        });
        const socket = {
            data: {
                user: {
                    id: 'other-user',
                    name: 'Other user',
                },
            },
            rooms: new Set(['mc-match:peril-test']),
        };
        let response;
        const sent = [];
        socketServer.send = (...args) => sent.push(args);

        socketServer.handleChatMessage(
            socket,
            {match: 'peril-test', message: 'No se debe enviar'},
            value => {
                response = value;
            }
        );

        assert.equal(response.ok, false);
        assert.match(response.error, /chat está deshabilitado/u);
        assert.deepEqual(match.chatMessages, []);
        assert.deepEqual(sent, []);

        match.endPerilResolution(resolution);
    });
});
