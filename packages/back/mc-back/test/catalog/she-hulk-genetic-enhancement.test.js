import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {CARD_TYPE_MINION} from 'mc-shared';
import sheHulk from '../../../mc-data/seed/catalog/heroes/she-hulk.js';
import rhino from '../../../mc-data/seed/catalog/scenarios/rhino.js';
import temporal from '../../../mc-data/seed/catalog/sets/temporal.js';
import {EngageEffect} from '../../src/effects/engage-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {restoreMatch, serializeMatch} from '../../src/utils/match-serialization.js';

describe('Mejora genética', () => {
    async function createMatch() {
        const refreshes = [];
        const match = new Match({
            name: 'genetic-enhancement',
            mc: {
                mcSocket: {
                    send(matchName, event, data) {
                        refreshes.push({event, data});
                    },
                },
            },
        });
        match.persist = async () => {};
        match.refresh = async () => {};
        match.openDialog = async () => ({});
        const factory = new MatchFactory(match);
        const player = match.createPlayer({
            name: 'Jugador',
            initial: true,
            superhero: factory.createSuperhero({
                ...sheHulk.config,
                cards: [],
                precon: [],
                obligation: undefined,
            }),
        });
        player.initPlayer();
        player.superhero.selectedSide = 1;
        match.currentPlayer = player;
        const scenario = await factory.createScenario({
            ...rhino.config,
            cards: [],
            sets: [],
            defaultSets: [],
        });
        match.addScenario(scenario);
        await scenario.initScenario([], false);
        const tyrannosaurus = factory.cardsFactory.createGameCardFromConfig(
            temporal.config.cards.find(({card}) =>
                card.params.name === 'Tiranosaurio rex').card,
            {owner: scenario},
        );
        const otherMinion = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {name: 'Otro esbirro', hitPoints: 4, attack: 1, scheme: 1},
        }, {owner: scenario});
        for (const card of [tyrannosaurus, otherMinion]) {
            await new EngageEffect({
                card,
                controller: scenario,
                selectedTarget: player,
                match,
            }).runEffect({player});
        }
        const enhancement = player.superhero.nemesis.find(card =>
            card.name === 'Mejora genética');

        return {match, player, scenario, tyrannosaurus, otherMinion, enhancement, refreshes};
    }

    test('adds three hit points to the attached minion in the first refresh and full snapshot', async () => {
        const {match, player, tyrannosaurus, otherMinion, enhancement, refreshes} =
            await createMatch();
        refreshes.length = 0;

        await new RevealEncounterEffect({
            match,
            selectedTarget: enhancement,
        }).runEffect({player});

        assert.equal(enhancement.attachedTo, tyrannosaurus);
        assert.ok(tyrannosaurus.attached.includes(enhancement));
        assert.equal(await tyrannosaurus.getHitPoints({player}), 9);
        assert.equal(await tyrannosaurus.getLife(), 9);
        assert.equal(await otherMinion.getHitPoints({player}), 4);
        assert.equal(await player.superhero.getHitPoints({player}), 15);
        assert.equal(await match.villain.getHitPoints({player}), 14);
        const firstRefresh = refreshes.find(({data}) =>
            data.id === tyrannosaurus.id && data.attached?.some(card =>
                card.id === enhancement.id));
        assert.ok(firstRefresh);
        assert.equal(firstRefresh.data.hitPoints, 9);
        assert.equal(firstRefresh.data.life, 9);
        const snapshot = await player.gameZone.toObjWithAbilityAvailability(player);
        const displayed = snapshot.minions.find(card => card.id === tyrannosaurus.id);
        assert.equal(displayed.hitPoints, 9);
        assert.equal(displayed.life, 9);

        tyrannosaurus.damage = 2;
        await tyrannosaurus.refresh();
        const damaged = refreshes.findLast(({data}) =>
            data.id === tyrannosaurus.id);
        assert.equal(damaged.data.hitPoints, 9);
        assert.equal(damaged.data.life, 7);

        await enhancement.discard();
        assert.ok(!tyrannosaurus.attached.includes(enhancement));
        assert.equal(await tyrannosaurus.getHitPoints({player}), 6);
        assert.equal(await tyrannosaurus.getLife(), 4);
        await tyrannosaurus.refresh();
        const withoutEnhancement = refreshes.findLast(({data}) =>
            data.id === tyrannosaurus.id);
        assert.equal(withoutEnhancement.data.hitPoints, 6);
        assert.equal(withoutEnhancement.data.life, 4);
    });

    test('preserves the attachment hit-point modifier when restoring a match', async () => {
        const {match, player, tyrannosaurus, enhancement} = await createMatch();
        await new RevealEncounterEffect({
            match,
            selectedTarget: enhancement,
        }).runEffect({player});
        tyrannosaurus.damage = 2;
        delete match.persist;
        delete match.refresh;
        delete match.openDialog;
        const restored = restoreMatch(serializeMatch(match), {
            mcSocket: {send() {}},
        });
        const restoredPlayer = restored.players[0];
        const restoredMinion = restoredPlayer.minions.find(card =>
            card.name === 'Tiranosaurio rex');
        const card = await restoredMinion.toObjWithAbilityAvailability(restoredPlayer);

        assert.equal(restoredMinion.attached[0].attachedTo, restoredMinion);
        assert.equal(card.hitPoints, 9);
        assert.equal(card.life, 7);
    });
});
