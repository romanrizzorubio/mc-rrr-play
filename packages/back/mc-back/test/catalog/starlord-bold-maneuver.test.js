import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CALC_COUNT,
    EFFECT_REMOVE_THREAT,
    TARGET_SCHEME,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {RemoveThreatEffect} from '../../src/effects/remove-threat-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';

describe('Maniobra audaz', () => {
    test('removes its base threat plus two per encounter card in the player zone', async () => {
        const {heroes} = await loadCatalog();
        const starlord = heroes.find(({_id}) => _id === 'starlord');
        const cardConfig = starlord.config.cards.find(({card}) =>
            card.params.name === 'Maniobra audaz').card;
        const [abilityConfig] = cardConfig.params.abilities;
        const {effect: effectConfig} = abilityConfig.params;

        assert.equal(effectConfig.type, EFFECT_REMOVE_THREAT);
        assert.equal(effectConfig.params.threat, 2);
        assert.deepEqual(effectConfig.params.additionalThreatCalc, {
            target: 'player.gameZone.encounters',
            formula: CALC_COUNT,
            multiply: 2,
        });

        const scheme = {
            isCard: true,
            isInPlay: true,
            isMainScheme: true,
            isScheme: true,
            threat: 10,
            canThwart() {
                return true;
            },
            canRemoveThreat() {
                return this.threat > 0;
            },
            removeThreat(amount) {
                this.threat = Math.max(0, this.threat - amount);
            },
            refresh() {},
        };
        const match = {
            inPlayCards: [],
            lasting: [],
            limits: {},
            players: [],
            scenario: {schemes: [scheme], sideSchemes: []},
            schemes: [scheme],
            triggerCards: {},
            mainScheme: scheme,
            numPlayers: 1,
        };
        const player = {
            isHero: true,
            isPlayer: true,
            match,
            gameZone: {encounters: [{}, {}]},
        };
        match.players.push(player);

        const factory = new MatchFactory(match);
        const card = factory.cardsFactory.createGameCardFromConfig(
            cardConfig,
            {owner: player}
        );
        const [ability] = card.abilities;
        const effect = ability.effect;
        const params = {card, match, player};

        assert.ok(effect instanceof RemoveThreatEffect);
        assert.equal(effect.target, TARGET_SCHEME);
        assert.equal(typeof effect.canRun, 'function');
        effect.selectedTarget = scheme;
        assert.equal(await effect.canRun(params), true);
        await effect.runEffect(params);

        assert.equal(scheme.threat, 4);
    });
});
