import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_ALLY,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_MINION,
    DIALOG_DEFENSE,
    DIALOG_LIST,
    DIALOG_USE_CARD,
    EFFECT_DISCARD_GAME,
    EFFECT_DEAL_DAMAGE,
    TARGET_VILLAIN,
    TRAIT_TECH,
    TRAIT_WEAPON,
} from 'mc-shared';
import kang from '../../../mc-data/seed/catalog/scenarios/kang.js';
import blackPanther from '../../../mc-data/seed/catalog/heroes/blackpanther.js';
import standard from '../../../mc-data/seed/catalog/sets/standard.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {EnemySchemeEffect} from '../../src/effects/enemy-scheme-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';

describe('Arma del futuro', () => {
    const createGame = async (copies = 1) => {
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'future-weapon-test',
        });
        match.persist = async () => {};
        match.refresh = async () => {};
        match.openDialog = async () => ({});
        const factory = new MatchFactory(match);
        const player = match.createPlayer({
            name: 'Jugador',
            initial: true,
            superhero: factory.createSuperhero({
                ...blackPanther.config,
                cards: [],
                precon: [],
                nemesis: [],
                obligation: undefined,
            }),
        });
        player.initPlayer();
        player.superhero.selectedSide = 1;
        match.currentPlayer = player;
        match.currentTurnPlayer = player;
        const scenario = await factory.createScenario({
            ...structuredClone(kang.config),
            cards: structuredClone([...kang.config.cards, ...standard.config.cards]),
            sets: [],
            defaultSets: [],
        });
        match.addScenario(scenario);
        await scenario.initScenario([], false);
        match.playing = true;
        match.phase = 'villain';
        const villain = match.villain;
        const baseAttack = await villain.getAttackValue({player});
        const weapons = scenario.scenarioCards.filter(card => card.name === 'Arma del futuro');
        for (const card of weapons.slice(0, copies)) {
            await new PutPlayEffect({
                match,
                card,
                controller: scenario,
                target: TARGET_VILLAIN,
            }).runEffect({match, player});
        }
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_USE_CARD) {
                return {selected: {id: dialog.data.cards[0].id}};
            }
            if (dialog.dialogType === DIALOG_LIST) {
                return {selected: {id: 0}};
            }
            return {};
        };
        return {match, factory, player, scenario, villain, weapons, baseAttack};
    };
    const attack = ({match, player, villain}, extra = {}) => new EnemyAttackEffect({
        match,
        enemy: villain,
        selectedTarget: player,
        giveBoost: false,
        ...extra,
    });

    test('catalog and runtime contain two runnable Technology/Weapon attachments in image order', async () => {
        const entry = kang.config.cards.find(({card}) => card.params.name === 'Arma del futuro');
        assert.equal(entry.count, 2);
        assert.equal(entry.card.type, CARD_TYPE_ATTACHMENT);
        assert.equal(entry.card.params.image, 'scenarios/kang/11015.png');
        assert.deepEqual(entry.card.params.traits, [TRAIT_TECH, TRAIT_WEAPON]);
        assert.equal(entry.card.params.attack, 2);
        assert.equal(entry.card.params.boost, 2);
        assert.equal(entry.card.params.attach, TARGET_VILLAIN);
        const images = kang.config.cards.map(({card}) => card.params.image);
        assert.deepEqual(images, images.toSorted());
        const game = await createGame(2);
        assert.equal(game.weapons.length, 2);
        assert.equal(new Set(game.weapons.map(card => card.id)).size, 2);
        assert.equal(await game.villain.getAttackValue({player: game.player}), game.baseAttack + 4);
        for (const weapon of game.weapons) {
            assert.equal(weapon.attachedTo, game.villain);
            for (const ability of weapon.abilities) {
                assert.equal(typeof ability.effect.canRun, 'function');
            }
        }
    });

    test('a real attack gains Overkill, stuns its damaged hero, and discards both copies afterward', async () => {
        const game = await createGame(2);
        const effect = attack(game);
        await effect.runEffect({player: game.player});
        assert.equal(effect.resolved, true);
        assert.equal(game.player.superhero.damage, game.baseAttack + 4);
        assert.equal(game.player.superhero.isStunned, true);
        assert.ok(game.weapons.every(card => !card.isInPlay));
        assert.ok(game.weapons.every(card => card.attachedTo === undefined));
        assert.ok(game.weapons.every(card => game.scenario.deck.discardPile.includes(card)));
        assert.equal(await game.villain.getAttackValue({player: game.player}), game.baseAttack);
        assert.equal(effect.overkill, false);

        game.player.superhero.stunned = 0;
        await attack(game).runEffect({player: game.player});
        assert.equal(game.player.superhero.isStunned, false);
        assert.equal(game.player.superhero.damage, game.baseAttack * 2 + 4);
    });

    for (const prevention of ['tough', 'all']) {
        test(`${prevention} prevention leaves the hero unstunned but still discards the weapon`, async () => {
            const game = await createGame();
            if (prevention === 'tough') {
                game.player.superhero.tough = 1;
            }
            const effect = attack(game);
            const openDialog = game.match.openDialog;
            game.match.openDialog = async dialog => {
                if (prevention === 'all' && dialog.dialogType === DIALOG_DEFENSE) {
                    effect.preventDamage = 99;
                }
                return openDialog(dialog);
            };
            await effect.runEffect({player: game.player});
            assert.equal(effect.resolved, true);
            assert.equal(game.player.superhero.damage, 0);
            assert.equal(game.player.superhero.isStunned, false);
            assert.equal(game.weapons[0].isInPlay, false);
        });
    }

    for (const life of [1, 10]) {
        test(`an ally with ${life} life only stuns the hero if Overkill actually damages that hero`, async () => {
            const game = await createGame();
            const ally = game.factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_ALLY,
                params: {name: 'Defensor', hitPoints: life, attack: 1, thwart: 1},
            });
            game.player.gameZone.addToGameZone(ally);
            ally.controller = game.player;
            ally.owner = game.player;
            const openDialog = game.match.openDialog;
            game.match.openDialog = async dialog => dialog.dialogType === DIALOG_DEFENSE ?
                {defender: {id: ally.id}} : openDialog(dialog);
            const effect = attack(game);
            await effect.runEffect({player: game.player});
            assert.equal(effect.resolved, true);
            const excess = Math.max(0, game.baseAttack + 2 - life);
            assert.equal(game.player.superhero.damage, excess);
            assert.equal(game.player.superhero.isStunned, excess > 0);
            assert.equal(ally.isStunned, false);
            assert.equal(game.weapons[0].isInPlay, false);
        });
    }

    test('Tough prevents Overkill damage and the corresponding stun', async () => {
        const game = await createGame();
        game.player.superhero.tough = 1;
        const ally = game.factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {name: 'Defensor', hitPoints: 1, attack: 1, thwart: 1},
        });
        game.player.gameZone.addToGameZone(ally);
        ally.controller = game.player;
        ally.owner = game.player;
        const openDialog = game.match.openDialog;
        game.match.openDialog = async dialog => dialog.dialogType === DIALOG_DEFENSE ?
            {defender: {id: ally.id}} : openDialog(dialog);
        await attack(game).runEffect({player: game.player});
        assert.equal(game.player.superhero.damage, 0);
        assert.equal(game.player.superhero.isStunned, false);
        assert.equal(game.player.superhero.tough, 0);
        assert.equal(game.weapons[0].isInPlay, false);
    });

    test('another enemy attack does not stun the hero or discard the weapon', async () => {
        const game = await createGame();
        const minion = game.factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {name: 'Otro atacante', hitPoints: 5, attack: 1, scheme: 1},
        });
        game.player.gameZone.addToGameZone(minion);
        minion.engaged = game.player;
        minion.controller = game.scenario;
        await attack(game, {enemy: minion}).runEffect({player: game.player});
        assert.equal(game.player.superhero.damage, 1);
        assert.equal(game.player.superhero.isStunned, false);
        assert.equal(game.weapons[0].isInPlay, true);
    });

    test('a stunned attempt and a scheme activation preserve the weapon', async () => {
        const game = await createGame();
        game.villain.stunned = 1;
        const effect = attack(game);
        await effect.runEffect({player: game.player});
        assert.equal(effect.resolved, false);
        assert.equal(game.player.superhero.damage, 0);
        assert.equal(game.weapons[0].isInPlay, true);
        const scheme = new EnemySchemeEffect({
            match: game.match,
            enemy: game.villain,
            selectedTarget: game.scenario.gameZone.currentScheme.currentSide,
            giveBoost: false,
        });
        await scheme.runEffect({player: game.player});
        assert.equal(game.weapons[0].isInPlay, true);
    });

    test('leaving play independently removes the printed ATK bonus', async () => {
        const game = await createGame();
        await game.match.effectsFactory.createEffect({
            type: EFFECT_DISCARD_GAME,
            params: {selectedTarget: game.weapons[0]},
        }).runEffect({player: game.player});
        assert.equal(await game.villain.getAttackValue({player: game.player}), game.baseAttack);
        await attack(game).runEffect({player: game.player});
        assert.equal(game.player.superhero.isStunned, false);
    });

    test('non-attack damage from Kang does not stun or consume the weapon', async () => {
        const game = await createGame();
        await game.match.effectsFactory.createEffect({
            type: EFFECT_DEAL_DAMAGE,
            params: {
                character: game.villain,
                selectedTarget: game.player,
                damage: 1,
                isAttack: false,
            },
        }).runEffect({player: game.player});
        assert.equal(game.player.superhero.damage, 1);
        assert.equal(game.player.superhero.isStunned, false);
        assert.equal(game.weapons[0].isInPlay, true);
    });

    test('a canceled attack preserves the weapon for the next actual attack', async () => {
        const game = await createGame();
        const effect = attack(game);
        const openDialog = game.match.openDialog;
        game.match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_DEFENSE) {
                effect.cancel();
            }
            return openDialog(dialog);
        };
        await effect.runEffect({player: game.player});
        assert.equal(game.player.superhero.damage, 0);
        assert.equal(game.player.superhero.isStunned, false);
        assert.equal(game.weapons[0].isInPlay, true);
        game.match.openDialog = openDialog;
        await attack(game).runEffect({player: game.player});
        assert.equal(game.player.superhero.isStunned, true);
        assert.equal(game.weapons[0].isInPlay, false);
    });

    test('another player defending receives the stun, not the original target', async () => {
        const game = await createGame();
        const defender = game.match.createPlayer({
            name: 'Defensor',
            superhero: game.factory.createSuperhero({
                ...blackPanther.config,
                cards: [],
                precon: [],
                nemesis: [],
                obligation: undefined,
            }),
        });
        defender.initPlayer();
        defender.superhero.selectedSide = 1;
        game.scenario.gameZone.addPlayer(defender);
        const openDialog = game.match.openDialog;
        game.match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_DEFENSE) {
                return dialog.targetPlayer === game.player ?
                    {defendingPlayerId: defender.id} :
                    {defender: {id: defender.superhero.id}};
            }
            return openDialog(dialog);
        };
        const effect = attack(game);
        await effect.runEffect({player: game.player});
        assert.equal(effect.resolved, true);
        assert.equal(game.player.superhero.damage, 0);
        assert.equal(game.player.superhero.isStunned, false);
        assert.ok(defender.superhero.damage > 0);
        assert.equal(defender.superhero.isStunned, true);
        assert.equal(game.weapons[0].isInPlay, false);
    });
});
