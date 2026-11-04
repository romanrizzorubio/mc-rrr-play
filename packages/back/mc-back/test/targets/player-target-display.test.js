import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {DIALOG_SELECT_TARGET, TARGET_ANY_PLAYER} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Player} from '../../src/model/match/player.js';
import {ValidTarget} from '../../src/targets/valid-target.js';

describe('player target hero cards', () => {
    const createMatch = async () => {
        const catalog = await loadCatalog();
        const dialogs = [];
        const match = {
            triggerCards: {},
            players: [],
            async openDialog(dialog) {
                dialogs.push(dialog);
                return {selected: dialog.data.multiSelect ?
                    [dialog.data.cards.at(-1)] : dialog.data.cards.at(-1)};
            },
        };
        const factory = new MatchFactory(match);
        match.players = ['captain-america', 'captain-marvel'].map((id, index) => {
            const config = catalog.heroes.find(hero => hero._id === id).config;
            const superhero = factory.createSuperhero({
                ...config,
                cards: [],
                obligation: undefined,
                nemesis: [],
                precon: [],
            });
            const player = new Player({
                name: `Player ${index + 1}`,
                userId: `player-${index + 1}`,
                superhero,
            });
            player.hand.refresh = async () => {};
            return player;
        });
        return {catalog, match, factory, dialogs};
    };
    const assertHeroOptions = async (dialog, players) => {
        assert.equal(dialog.dialogType, DIALOG_SELECT_TARGET);
        const expectedCards = await Promise.all(players.map(async player => ({
            ...player.toTargetObj(),
            ...await player.superhero.getEffectiveStats({player}),
        })));
        assert.deepEqual(dialog.data.cards, expectedCards);
        for (const card of dialog.data.cards) {
            assert.ok(card.image);
            assert.ok(Array.isArray(card.attached));
            assert.ok(Array.isArray(card.faceDown));
            assert.ok(Array.isArray(card.tuckedCards));
            assert.ok(card.statusCards);
        }
    };

    test('serializes real superhero images without a controller-target source', async () => {
        const {match} = await createMatch();
        const player = match.players[0];
        assert.equal(player.superhero.image, undefined);
        const alterEgo = player.toTargetObj();
        assert.equal(alterEgo.name, 'Steve Rogers');
        assert.equal(alterEgo.image, 'heroes/captain-america/03001b.png');
        assert.equal(alterEgo.id, player.id);
        assert.notEqual(alterEgo.id, player.superhero.id);

        player.superhero.selectedSide = 1;
        const hero = player.toTargetObj();
        assert.equal(hero.name, 'Capitán América');
        assert.equal(hero.image, 'heroes/captain-america/03001a.png');
        assert.equal(hero.id, alterEgo.id);
    });

    for (const sourceName of ['Mansión de los Vengadores', 'Comandante']) {
        test(`${sourceName} shows every eligible hero and draws for the chosen player`, async () => {
            const {catalog, match, factory, dialogs} = await createMatch();
            const actor = match.players[sourceName === 'Comandante' ? 1 : 0];
            const card = sourceName === 'Comandante' ?
                actor.superhero.currentSide :
                factory.cardsFactory.createGameCardFromConfig(
                    catalog.aspects.find(entry =>
                        entry._id === 'basic-avengers-mansion').card,
                    {owner: actor},
                );
            const ability = sourceName === 'Comandante' ?
                card.abilities.find(ability => ability.name === sourceName) :
                card.abilities[0];
            const effect = ability.effect;
            const drawnCard = {id: 'drawn-card'};
            match.players.forEach(player => {
                player.deck = {
                    async draw(count) {
                        assert.strictEqual(player, match.players[1]);
                        assert.equal(count, 1);
                        return [drawnCard];
                    },
                };
            });

            await effect.runEffect({match, card, player: actor});

            assert.equal(dialogs.length, 1);
            assert.equal(dialogs[0].targetPlayer, actor.id);
            await assertHeroOptions(dialogs[0], match.players);
            assert.strictEqual(effect.selectedTarget, match.players[1]);
            assert.deepEqual(match.players[1].hand.cards, [drawnCard]);
            assert.deepEqual(match.players[0].hand.cards, []);
        });
    }

    test('multiple player selection keeps player IDs and hero cards', async () => {
        const {match, dialogs} = await createMatch();
        const target = new ValidTarget({match});
        const selected = await target.selectTarget({
            player: match.players[0],
            target: TARGET_ANY_PLAYER,
            selectCount: 1,
        });

        assert.deepEqual(selected, [match.players[1]]);
        assert.equal(dialogs[0].targetPlayer, match.players[0].id);
        await assertHeroOptions(dialogs[0], match.players);
    });

    test('only eligible players appear and an explicit decision recipient is preserved', async () => {
        const {match, dialogs} = await createMatch();
        const target = new ValidTarget({
            match,
            filter: player => player !== match.players[0],
        });
        const selected = await target.selectTarget({
            player: match.players[0],
            targetPlayer: match.players[1],
            target: TARGET_ANY_PLAYER,
            selectCount: 1,
            selectUpTo: true,
        });

        assert.deepEqual(selected, [match.players[1]]);
        assert.equal(dialogs[0].targetPlayer, match.players[1].id);
        await assertHeroOptions(dialogs[0], [match.players[1]]);
    });

    test('a single eligible player is selected without an unnecessary dialog', async () => {
        const {match, dialogs} = await createMatch();
        const target = new ValidTarget({
            match,
            filter: player => player === match.players[1],
        });
        const selected = await target.selectTarget({
            player: match.players[0],
            target: TARGET_ANY_PLAYER,
        });

        assert.strictEqual(selected, match.players[1]);
        assert.deepEqual(dialogs, []);
    });
});
