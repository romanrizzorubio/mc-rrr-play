import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CALC_STAGE,
    CARD_TYPE_EVENT,
    CLASSIFICATION_JUSTICE,
    EFFECT_REMOVE_THREAT,
    LABEL_THWART,
    RESOURCE_PHYSICAL,
    TARGET_MAIN_SCHEME,
    TARGET_VILLAIN,
    TRAIT_AVENGER,
    TRAIT_THWART,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {RemoveThreatEffect} from '../../src/effects/remove-threat-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {PlayerCard} from '../../src/model/printed/player-card.js';

describe('Impedimentos', () => {
    test('is a shared Justice thwart event with its printed restriction and no precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const entry = aspects.find(({_id}) =>
            _id === 'justice-impedimentos');

        assert.ok(entry);
        assert.equal(entry.aspect, CLASSIFICATION_JUSTICE);
        assert.equal(entry.card.type, CARD_TYPE_EVENT);
        assert.equal(entry.card.params.name, 'Impedimentos');
        assert.equal(entry.card.params.set, CLASSIFICATION_JUSTICE);
        assert.equal(
            entry.card.params.image,
            'aspect/justice/events/13031.png'
        );
        assert.deepEqual(entry.card.params.traits, [TRAIT_THWART]);
        assert.equal(entry.card.params.cost, 2);
        assert.deepEqual(entry.card.params.resources, [RESOURCE_PHYSICAL]);
        assert.equal(
            entry.card.params.classification,
            CLASSIFICATION_JUSTICE
        );
        assert.deepEqual(entry.card.params.paramsToPlay, {
            'superhero.traits': TRAIT_AVENGER,
        });

        const card = new PlayerCard(entry.card.params);
        const currentSide = {traits: []};
        const player = {
            superhero: {
                currentSide,
                otherSide: {traits: [TRAIT_AVENGER]},
                get traits() {
                    return this.currentSide.traits;
                },
            },
        };
        assert.equal(card.canPlay({player}), false);
        currentSide.traits.push(TRAIT_AVENGER);
        assert.equal(card.canPlay({player}), true);

        const [ability] = entry.card.params.abilities;
        assert.equal(ability.type, ABILITY_HERO_ACTION);
        assert.deepEqual(ability.params.labels, [LABEL_THWART]);
        assert.deepEqual(ability.params.effect, {
            type: EFFECT_REMOVE_THREAT,
            params: {
                target: TARGET_MAIN_SCHEME,
                threat: 2,
                additionalThreatCalc: {
                    target: TARGET_VILLAIN,
                    formula: CALC_STAGE,
                    max: 3,
                },
            },
        });

        const preconIds = heroes.flatMap(({config}) =>
            (config.precon ?? []).flatMap(({cardRefs = []}) =>
                cardRefs.map(({id}) => id)
            )
        );
        const heroCardNames = heroes.flatMap(({config}) =>
            (config.cards ?? []).map(({card: heroCard}) =>
                heroCard.params.name
            )
        );
        assert.equal(preconIds.includes(entry._id), false);
        assert.equal(heroCardNames.includes('Impedimentos'), false);
    });

    test('removes 2 threat plus the Villain stage, capped at 3 additional', async () => {
        const {aspects} = await loadCatalog();
        const cardConfig = aspects.find(({_id}) =>
            _id === 'justice-impedimentos').card;

        for (const {stage, expectedRemoved} of [
            {stage: 1, expectedRemoved: 3},
            {stage: 2, expectedRemoved: 4},
            {stage: 3, expectedRemoved: 5},
            {stage: 4, expectedRemoved: 5},
        ]) {
            const scheme = {
                isInPlay: true,
                isMainScheme: true,
                isCard: true,
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
                currentRound: 1,
                dialogs: [],
                inPlayCards: [],
                lasting: [],
                limits: {},
                players: [],
                scenario: {schemes: [scheme], sideSchemes: []},
                schemes: [scheme],
                triggerCards: {},
                mainScheme: scheme,
                villain: {stage},
                numPlayers: 1,
                async openDialog(dialog) {
                    this.dialogs.push(dialog);

                    return {selected: scheme};
                },
            };
            const player = {
                isHero: true,
                isPlayer: true,
                match,
                canThwart() {
                    return true;
                },
            };
            match.players.push(player);

            const matchFactory = new MatchFactory(match);
            const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(
                cardConfig,
                {owner: player}
            );
            const [ability] = gameCard.abilities;
            const effect = ability.effect;
            const params = {card: gameCard, match, player};

            assert.ok(effect instanceof RemoveThreatEffect);
            assert.equal(ability.isThwart, true);
            assert.equal(typeof effect.canRun, 'function');
            effect.selectedTarget = scheme;
            assert.equal(await effect.canRun(params), true);
            await effect.runEffect(params);

            assert.equal(scheme.threat, 10 - expectedRemoved);
        }
    });
});
