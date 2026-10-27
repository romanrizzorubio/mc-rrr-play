import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {DIALOG_ENCOUNTERS_REVEAL} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

describe('Rhino Expert initial reveal', () => {
    test('reveals Arramblar con todo when setup assigns the first player', async () => {
        const catalog = await loadCatalog();
        const rhino = catalog.scenarios.find(({_id}) => _id === 'rhino');
        const antMan = catalog.heroes.find(({_id}) => _id === 'ant-man');
        assert.ok(rhino);
        assert.ok(antMan);

        const mc = {
            data: {
                getSetConfig: async id => {
                    const set = catalog.sets.find(({_id}) => _id === id);
                    assert.ok(set, `Missing set config: ${id}`);

                    return set.config;
                },
            },
            mcSocket: {
                send() {},
                dispatch() {},
            },
            getMatch(name) {
                return this.match?.name === name ? this.match : undefined;
            },
            async persistMatch() {},
        };
        const match = new Match({mc, name: 'rhino-expert-initial-reveal'});
        mc.match = match;
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);

            return {};
        };

        const matchFactory = new MatchFactory(match);
        const player = match.createPlayer({
            name: 'Scott Lang',
            superhero: matchFactory.createSuperhero({
                ...antMan.config,
                precon: [],
            }),
            config: antMan.config,
        });
        match.addScenario(await matchFactory.createScenario(rhino.config));

        match.drawInitial = async () => {};
        match.mulligan = async () => {};
        match.resolveSetupPlayer = async () => {};
        match.startMatch = async () => {};

        await match.initMatch(true);

        assert.equal(match.initialPlayer, player);
        const arramblar = match.scenario.sideSchemes.find(
            ({name}) => name === 'Arramblar con todo'
        );
        assert.ok(arramblar);
        assert.equal(arramblar.threat, 3);
        assert.ok(dialogs.some(({dialogType, data}) =>
            dialogType === DIALOG_ENCOUNTERS_REVEAL &&
            data?.card?.name === 'Arramblar con todo'
        ));

        const snapshot = await match.toObjWithPlayableHands();
        assert.ok(snapshot.scenario.gameZone.cards.some(card =>
            card.name === 'Arramblar con todo' && card.threat === 3
        ));
    });
});
