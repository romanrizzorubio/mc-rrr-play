import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    DIALOG_SELECT_TARGET,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

describe('Captain Marvel Commander ability', () => {
    test('asks the acting hero to choose the beneficiary even when both heroes share an account', async () => {
        const {heroes} = await loadCatalog();
        const captainMarvelConfig = heroes.find(({_id}) =>
            _id === 'captain-marvel');
        const blackPantherConfig = heroes.find(({_id}) =>
            _id === 'blackpanther');
        assert.ok(captainMarvelConfig);
        assert.ok(blackPantherConfig);

        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'captain-marvel-commander',
        });
        match.scenario = {
            villain: undefined,
            gameZone: {
                currentScheme: undefined,
                cards: [],
            },
        };
        const matchFactory = new MatchFactory(match);
        let targetDialog;
        const createPlayer = (name, heroConfig) => {
            const superhero = matchFactory.createSuperhero({
                ...heroConfig.config,
                precon: [],
            });
            const alterEgoIndex = superhero.sides.findIndex(side =>
                side.isAlterEgo
            );
            if (alterEgoIndex >= 0) {
                superhero.selectedSide = alterEgoIndex;
            }

            const player = match.createPlayer({name, userId: 'shared-account', superhero});
            player.gameZone = new PlayerZone({owner: player});
            player.hand.refresh = async () => {};

            return player;
        };
        const captainMarvel = createPlayer('Capitana Marvel', captainMarvelConfig);
        const blackPanther = createPlayer('Pantera Negra', blackPantherConfig);
        const drawnCard = {id: 'drawn-by-commander'};
        blackPanther.deck = {
            async draw(count) {
                assert.equal(count, 1);
                return [drawnCard];
            },
        };
        match.openDialog = async dialog => {
            targetDialog = dialog;

            return {
                selected: dialog.data.cards.find(({id}) =>
                    id === blackPanther.id
                ),
            };
        };
        const commander = captainMarvel.superhero.currentSide.abilities.find(
            ({name}) => name === 'Comandante'
        );

        assert.ok(commander);
        assert.notEqual(captainMarvel.id, blackPanther.id);
        assert.equal(captainMarvel.userId, blackPanther.userId);
        await commander.resolveAbility({
            card: captainMarvel.superhero,
            match,
            player: captainMarvel,
        });

        assert.equal(targetDialog.dialogType, DIALOG_SELECT_TARGET);
        assert.equal(targetDialog.targetPlayer, captainMarvel.id);
        assert.deepEqual(
            targetDialog.data.cards.map(({id, name, isPlayer}) => ({
                id,
                name,
                isPlayer,
            })),
            [
                {
                    id: captainMarvel.id,
                    name: captainMarvel.superhero.name,
                    isPlayer: true,
                },
                {
                    id: blackPanther.id,
                    name: blackPanther.superhero.name,
                    isPlayer: true,
                },
            ],
        );
        assert.deepEqual(
            targetDialog.data.cards.map(({image}) => image),
            [
                captainMarvel.superhero.toObj().image,
                blackPanther.superhero.toObj().image,
            ],
        );
        assert.equal(captainMarvel.hand.cards.includes(drawnCard), false);
        assert.equal(blackPanther.hand.cards.includes(drawnCard), true);
    });
});
