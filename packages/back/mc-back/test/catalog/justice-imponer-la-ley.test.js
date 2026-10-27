import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_RESPONSE,
    CARD_TYPE_EVENT,
    CLASSIFICATION_JUSTICE,
    EFFECT_DO_IF_HAS_PAID,
    EFFECT_REMOVE_THREAT,
    LABEL_THWART,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    TARGET_SCHEME,
    TRAIT_THWART,
    TRIGGER_YOUR_SUPERHERO_FLIPS,
} from 'mc-shared';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {HeroResponseAbility} from '../../src/abilities/response/hero-response-ability.js';
import {DoIfHasPaidEffect} from '../../src/effects/do-if-has-paid-effect.js';
import {RemoveThreatEffect} from '../../src/effects/remove-threat-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';

describe('Imponer la ley', () => {
    test('is a shared Justice thwart event, not assigned to a hero or precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const definition = aspects.find(({_id}) =>
            _id === 'justice-imponer-la-ley');

        assert.ok(definition);
        assert.equal(definition.aspect, CLASSIFICATION_JUSTICE);
        assert.equal(definition.card.type, CARD_TYPE_EVENT);
        assert.equal(definition.card.params.name, 'Imponer la ley');
        assert.equal(definition.card.params.set, CLASSIFICATION_JUSTICE);
        assert.equal(
            definition.card.params.image,
            'aspect/justice/events/12031.png'
        );
        assert.deepEqual(definition.card.params.traits, [TRAIT_THWART]);
        assert.equal(definition.card.params.cost, 1);
        assert.deepEqual(definition.card.params.resources, [RESOURCE_MENTAL]);
        assert.equal(
            definition.card.params.classification,
            CLASSIFICATION_JUSTICE
        );

        const [ability] = definition.card.params.abilities;
        assert.equal(ability.type, ABILITY_HERO_RESPONSE);
        assert.deepEqual(ability.params.labels, [LABEL_THWART]);
        assert.equal(
            ability.params.trigger,
            TRIGGER_YOUR_SUPERHERO_FLIPS
        );
        assert.deepEqual(ability.params.effect, {
            type: EFFECT_DO_IF_HAS_PAID,
            params: {
                target: TARGET_SCHEME,
                resources: [RESOURCE_MENTAL],
                effect: {
                    type: EFFECT_REMOVE_THREAT,
                    params: {target: TARGET_SCHEME, threat: 4},
                },
                effectNot: {
                    type: EFFECT_REMOVE_THREAT,
                    params: {target: TARGET_SCHEME, threat: 3},
                },
            },
        });

        const preconIds = heroes.flatMap(({config}) =>
            (config.precon ?? []).flatMap(({cardRefs = []}) =>
                cardRefs.map(({id}) => id)
            )
        );
        const heroCardNames = heroes.flatMap(({config}) =>
            (config.cards ?? []).map(({card}) => card.params.name)
        );
        assert.equal(preconIds.includes(definition._id), false);
        assert.equal(heroCardNames.includes('Imponer la ley'), false);
    });

    test('removes 4 threat when paid with mental, otherwise removes 3', async () => {
        const {aspects} = await loadCatalog();
        const cardConfig = aspects.find(({_id}) =>
            _id === 'justice-imponer-la-ley').card;

        for (const {resourcesPaid, expectedThreat} of [
            {resourcesPaid: [RESOURCE_MENTAL], expectedThreat: 6},
            {resourcesPaid: [RESOURCE_ENERGY], expectedThreat: 7},
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
                numPlayers: 1,
                async openDialog(dialog) {
                    this.dialogs.push(dialog);

                    return {selected: scheme};
                },
            };
            const matchFactory = new MatchFactory(match);
            const player = {
                isHero: true,
                isPlayer: true,
                match,
                canThwart() {
                    return true;
                },
            };
            match.players.push(player);

            const card = matchFactory.cardsFactory.createGameCardFromConfig(
                cardConfig,
                {owner: player}
            );
            const [ability] = card.abilities;
            const effect = ability.effect;
            const params = {
                card,
                match,
                player,
                playCardEffect: {resourcesPaid},
            };

            assert.ok(ability instanceof HeroResponseAbility);
            assert.ok(effect instanceof DoIfHasPaidEffect);
            assert.ok(effect.effect instanceof RemoveThreatEffect);
            assert.ok(effect.effectNot instanceof RemoveThreatEffect);
            assert.equal(ability.trigger, TRIGGER_YOUR_SUPERHERO_FLIPS);
            effect.selectedTarget = scheme;
            assert.equal(await effect.canRun(params), true);
            await effect.runEffect(params);

            assert.equal(scheme.threat, expectedThreat);
        }
    });
});
