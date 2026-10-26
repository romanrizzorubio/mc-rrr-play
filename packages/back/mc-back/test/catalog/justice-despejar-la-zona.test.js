import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CARD_TYPE_EVENT,
    CLASSIFICATION_JUSTICE,
    EFFECT_CHAINED,
    EFFECT_DO_IF,
    EFFECT_DRAW_CARD,
    EFFECT_REMOVE_THREAT,
    LABEL_THWART,
    RESOURCE_MENTAL,
    TARGET_SCHEME,
    TARGET_YOU,
    TRAIT_THWART,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {DoIfEffect} from '../../src/effects/do-if-effect.js';
import {DrawEffect} from '../../src/effects/draw-effect.js';
import {RemoveThreatEffect} from '../../src/effects/remove-threat-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';

const createEffectContext = (cardConfig, threat) => {
    const match = {
        currentRound: 1,
        lasting: [],
        limits: {},
        players: [],
        scenario: {},
        triggerCards: {},
        async openDialog() {
            return {};
        },
    };
    const matchFactory = new MatchFactory(match);

    const drawnCards = [];
    const player = {
        isPlayer: true,
        isHero: true,
        match,
        canThwart() {
            return true;
        },
        deck: {
            async draw(count) {
                return Array.from({length: count}, (_, index) => ({
                    id: `draw-${index}`,
                }));
            },
        },
        hand: {
            cards: drawnCards,
            addCards(cards) {
                this.cards.push(...cards);
            },
            async refresh() {},
        },
    };
    match.players.push(player);
    match.numPlayers = 1;

    const scheme = {
        id: 'main-scheme',
        isInPlay: true,
        isMainScheme: true,
        isCard: true,
        isScheme: true,
        threat,
        canThwart(targetPlayer) {
            return this.canRemoveThreat() && targetPlayer.isHero;
        },
        canRemoveThreat() {
            return this.threat > 0;
        },
        removeThreat(amount) {
            this.threat = Math.max(0, this.threat - amount);
        },
        async refresh() {},
    };
    match.mainScheme = scheme;
    match.schemes = [scheme];

    const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(
        cardConfig,
        {owner: player}
    );

    return {
        gameCard,
        match,
        player,
        scheme,
    };
};

describe('Despejar la zona', () => {
    test('is a Justice thwart event included three times in Spider-Woman precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const entry = aspects.find(({_id}) =>
            _id === 'justice-despejar-la-zona');
        const spiderwoman = heroes.find(({_id}) => _id === 'spiderwoman');

        assert.ok(entry);
        assert.ok(spiderwoman);
        assert.equal(entry.aspect, CLASSIFICATION_JUSTICE);
        assert.equal(entry.card.type, CARD_TYPE_EVENT);
        assert.equal(entry.card.params.name, 'Despejar la zona');
        assert.equal(entry.card.params.set, CLASSIFICATION_JUSTICE);
        assert.equal(
            entry.card.params.image,
            'aspect/justice/events/04049.png'
        );
        assert.deepEqual(entry.card.params.traits, [TRAIT_THWART]);
        assert.equal(entry.card.params.classification, CLASSIFICATION_JUSTICE);
        assert.equal(entry.card.params.cost, 1);
        assert.deepEqual(entry.card.params.resources, [RESOURCE_MENTAL]);
        assert.equal(
            spiderwoman.config.precon
                .find(({aspect}) => aspect === CLASSIFICATION_JUSTICE)
                .cardRefs.find(({id}) => id === entry._id).count,
            3
        );

        const [abilityConfig] = entry.card.params.abilities;
        assert.equal(abilityConfig.type, ABILITY_HERO_ACTION);
        assert.deepEqual(abilityConfig.params.labels, [LABEL_THWART]);
        assert.deepEqual(abilityConfig.params.effect, {
            type: EFFECT_CHAINED,
            params: {
                target: TARGET_SCHEME,
                effects: [
                    {
                        type: EFFECT_REMOVE_THREAT,
                        params: {
                            target: TARGET_SCHEME,
                            threat: 2,
                        },
                    },
                    {
                        type: EFFECT_DO_IF,
                        params: {
                            condition: {
                                'effects.0.selectedTarget.threat': 0,
                            },
                            effect: {
                                type: EFFECT_DRAW_CARD,
                                params: {
                                    target: TARGET_YOU,
                                    count: 1,
                                },
                            },
                        },
                    },
                ],
            },
        });
    });

    test('draws only when its threat removal leaves the selected scheme empty', async () => {
        const {aspects} = await loadCatalog();
        const cardConfig = aspects.find(({_id}) =>
            _id === 'justice-despejar-la-zona').card;

        for (const {threat, expectedDraws} of [
            {threat: 2, expectedDraws: 1},
            {threat: 3, expectedDraws: 0},
        ]) {
            const {gameCard, match, player, scheme} =
                createEffectContext(cardConfig, threat);
            const [ability] = gameCard.abilities;
            const [removeThreat, drawIfEmpty] = ability.effect.effects;

            assert.ok(ability.effect instanceof ChainedEffect);
            assert.equal(ability.isThwart, true);
            assert.equal(typeof ability.effect.canRun, 'function');
            assert.ok(removeThreat instanceof RemoveThreatEffect);
            assert.ok(drawIfEmpty instanceof DoIfEffect);
            assert.ok(drawIfEmpty.effect instanceof DrawEffect);
            assert.equal(typeof drawIfEmpty.effect.canRun, 'function');

            await ability.effect.runEffect({
                card: gameCard,
                match,
                player,
            });

            assert.equal(scheme.threat, Math.max(0, threat - 2));
            assert.equal(player.hand.cards.length, expectedDraws);
        }
    });
});
