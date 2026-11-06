import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_MINION,
    DIALOG_SELECT_TARGET,
    RESOURCE_MENTAL,
} from 'mc-shared';
import msMarvel from '../../../mc-data/seed/catalog/heroes/ms-marvel.js';
import rhino from '../../../mc-data/seed/catalog/scenarios/rhino.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

describe('Ms. Marvel nemesis attack targets', () => {
    async function createFixture(playerCount = 1) {
        const match = new Match({
            name: 'ms-marvel-nemesis-targets',
            mc: {mcSocket: {send() {}}},
        });
        match.persist = async () => {};
        match.refresh = async () => {};
        match.openDialog = async () => ({});
        const factory = new MatchFactory(match);
        for (let index = 0; index < playerCount; index++) {
            const player = match.createPlayer({
                name: `Jugador ${index + 1}`,
                initial: index === 0,
                superhero: factory.createSuperhero({
                    ...structuredClone(msMarvel.config),
                    precon: [],
                    obligation: undefined,
                }),
            });
            player.initPlayer();
            player.superhero.selectedSide = 1;
        }
        const player = match.initialPlayer;
        const scenario = await factory.createScenario({
            ...structuredClone(rhino.config),
            cards: [],
            sets: [],
            defaultSets: [],
        });
        match.addScenario(scenario);
        await scenario.initScenario([], false);
        match.phase = 'players';
        match.playing = true;
        match.currentPlayer = player;
        match.currentTurnPlayer = player;
        await player.superhero.initTriggers({player});
        const basic = player.superhero.currentSide.abilities.find(ability =>
            ability.isBasic && ability.isAttack);
        assert.ok(basic);
        const edison = player.superhero.nemesis.find(card => card.name === 'Thomas Edison');
        const robot = player.superhero.nemesis.find(card => card.name === 'Robot gigante de Edison');
        assert.ok(edison);
        assert.ok(robot);
        async function reveal(card, targetPlayer = player) {
            await new RevealEncounterEffect({match, selectedTarget: card}).runEffect({player: targetPlayer});
            assert.equal(card.isInPlay, true);
            assert.equal(card.engaged, targetPlayer);
            return card;
        }
        async function revealOther(targetPlayer = player) {
            const card = factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_MINION,
                params: {name: 'Otro esbirro', attack: 1, scheme: 1, hitPoints: 5},
            }, {owner: scenario});
            return reveal(card, targetPlayer);
        }
        return {match, player, basic, edison, robot, reveal, revealOther};
    }

    test('Edison with another engaged minion blocks only himself and still permits a real basic attack', async () => {
        const {match, player, basic, edison, reveal, revealOther} = await createFixture();
        await reveal(edison);
        const other = await revealOther();

        const targets = await basic.effect.getValidTarget({player});
        assert.ok(!targets.includes(edison));
        assert.ok(targets.includes(other), 'Edison must not prevent attacking another minion');
        assert.ok(targets.includes(match.villain), 'Edison must not prevent attacking the villain');
        assert.equal(await basic.canRun({player, card: player.superhero.currentSide}), true);
        let targetDialogs = 0;
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_SELECT_TARGET) {
                targetDialogs++;
                assert.ok(dialog.data.cards.some(card => card.id === other.id));
                assert.ok(!dialog.data.cards.some(card => card.id === edison.id));
                return {selected: {id: other.id}};
            }
            return {};
        };

        await basic.resolveAbility({player, card: player.superhero.currentSide});

        assert.equal(targetDialogs, 1);
        assert.equal(other.damage, 1);
        assert.equal(edison.damage, 0);
        assert.equal(player.superhero.exhausted, true);
    });

    test('Edison alone and the villain remain valid attack targets', async () => {
        const {match, player, basic, edison, reveal} = await createFixture();
        await reveal(edison);
        const targets = await basic.effect.getValidTarget({player});
        assert.ok(targets.includes(edison));
        assert.ok(targets.includes(match.villain));
    });

    test('a minion engaged with another player does not protect Edison', async () => {
        const {match, player, basic, edison, reveal, revealOther} = await createFixture(2);
        await reveal(edison);
        const other = await revealOther(match.players[1]);
        const targets = await basic.effect.getValidTarget({player});
        assert.ok(targets.includes(edison));
        assert.ok(targets.includes(other));
        assert.ok(targets.includes(match.villain));
    });

    test('defeating the other minion immediately makes Edison attackable', async () => {
        const {match, player, basic, edison, reveal, revealOther} = await createFixture();
        await reveal(edison);
        const other = await revealOther();
        assert.ok(!(await basic.effect.getValidTarget({player})).includes(edison));

        await new DefeatEffect({match, selectedTarget: other}).runEffect({player});

        assert.equal(other.isInPlay, false);
        assert.ok((await basic.effect.getValidTarget({player})).includes(edison));
    });

    test('the giant robot protects only itself and blanking its text restores its target', async () => {
        const {match, player, basic, edison, robot, reveal, revealOther} = await createFixture();
        await reveal(edison);
        await reveal(robot);
        const other = await revealOther();
        let targets = await basic.effect.getValidTarget({player});
        assert.ok(!targets.includes(edison));
        assert.ok(!targets.includes(robot));
        assert.ok(targets.includes(other));
        assert.ok(targets.includes(match.villain));

        robot.printedTextBlank = true;
        targets = await basic.effect.getValidTarget({player});
        assert.ok(targets.includes(robot));
        assert.ok(!targets.includes(edison));
        assert.ok(targets.includes(other));
    });

    test('the giant robot action pays with the activating hero after a stale player selection', async () => {
        const {match, player, robot, reveal} = await createFixture(2);
        const staleTargetPlayer = match.players[1];
        await reveal(robot, player);
        assert.equal(robot.engaged, player);

        let paymentPlayer;
        for (const owner of [player, staleTargetPlayer]) {
            const generator = {
                id: `resource-generator-${owner.id}`,
                owner,
                abilities: [{
                    isResource: true,
                    resources: [RESOURCE_MENTAL],
                }],
                async resolveResourceAbility() {},
            };
            owner.getCardsToPay = async () => ({
                generators: [generator],
                hand: [],
            });
            owner.spendResources = async () => {
                paymentPlayer = owner;
                return {
                    generators: [generator],
                    hand: [],
                    resources: [RESOURCE_MENTAL],
                    fullyPaid: true,
                };
            };
        }

        const ability = robot.abilities.find(ability => ability.isAction);
        assert.ok(ability);
        ability.arrow.cost.selectedTarget = staleTargetPlayer;

        const params = {ability, card: robot, match, player};
        assert.equal(await ability.costs.canPay(params), true);
        const result = await ability.costs.pay(params);

        assert.equal(result.resolved, true);
        assert.equal(paymentPlayer, player);
        assert.equal(ability.arrow.cost.selectedTarget, player);
    });
});
