import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CALC_STAGE,
    CLASSIFICATION_LEADERSHIP,
    EFFECT_HEAL,
    RESOURCE_PHYSICAL,
    TARGET_ALL_FRIENDLY_CHARACTERS,
    TARGET_VILLAIN,
    TRAIT_AVENGER,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {PlayerCard} from '../../src/model/printed/player-card.js';
import {HealEffect} from '../../src/effects/heal-effect.js';

describe('Unidos resistimos', () => {
    const loadCard = async () => {
        const {aspects, heroes} = await loadCatalog();
        const cardConfig = aspects.find(({_id}) =>
            _id === 'leadership-unidos-resistimos');

        assert.ok(cardConfig);
        assert.equal(cardConfig.aspect, 'leadership');
        assert.equal(
            heroes.some(({config}) => config.precon?.some(({cardRefs = []}) =>
                cardRefs.some(({id}) => id === cardConfig._id))),
            false
        );

        return cardConfig;
    };

    const createGameCard = (cardConfig, player) => {
        const matchFactory = new MatchFactory({
            triggerCards: {},
            isUniqueCard: () => false,
        });

        return matchFactory.cardsFactory.createGameCardFromConfig(
            cardConfig.card,
            {owner: player}
        );
    };

    test('is a shared Leadership Event with its printed restriction and Hero Action', async () => {
        const cardConfig = await loadCard();
        const {params} = cardConfig.card;

        assert.equal(params.name, 'Unidos resistimos');
        assert.equal(params.set, CLASSIFICATION_LEADERSHIP);
        assert.equal(params.image, 'aspect/leadership/events/14031.png');
        assert.equal(params.cost, 0);
        assert.deepEqual(params.resources, [RESOURCE_PHYSICAL]);
        assert.equal(params.classification, CLASSIFICATION_LEADERSHIP);
        assert.deepEqual(params.paramsToPlay, {
            'superhero.traits': TRAIT_AVENGER
        });
        assert.equal(params.abilities[0].type, ABILITY_HERO_ACTION);

        const player = {
            hand: {cards: []},
            superhero: {traits: [TRAIT_AVENGER]},
        };
        const gameCard = createGameCard(cardConfig, player);
        player.hand.cards.push(gameCard);

        assert.equal(PlayerCard.prototype.canPlay.call(gameCard.card, {
            gameCard,
            player,
        }), true);
        player.superhero.traits = [];
        assert.equal(PlayerCard.prototype.canPlay.call(gameCard.card, {
            gameCard,
            player,
        }), false);

        const [ability] = gameCard.abilities;
        assert.ok(ability.effect instanceof HealEffect);
        assert.equal(typeof ability.effect.canRun, 'function');
        assert.equal(ability.effect.effectType, EFFECT_HEAL);
        assert.equal(ability.effect.target, TARGET_ALL_FRIENDLY_CHARACTERS);
        assert.equal(ability.effect.damage, 1);
        assert.equal(ability.effect.validTarget.multipleTarget, true);
        assert.equal(ability.effect.selectUpTo, true);
        assert.deepEqual(ability.effect.targetCountCalc, {
            target: TARGET_VILLAIN,
            formula: CALC_STAGE,
            max: 3,
        });
    });

    test('heals up to the Villain stage, capped at three, using runtime stage context', async () => {
        const cardConfig = await loadCard();
        const player = {
            hand: {cards: []},
            superhero: {traits: [TRAIT_AVENGER]},
        };
        const gameCard = createGameCard(cardConfig, player);
        const characters = Array.from({length: 5}, (_, index) => ({
            id: `friendly-${index}`,
            name: `Friendly ${index}`,
            damage: index === 4 ? 0 : 2,
            get canHeal() {
                return this.damage > 0;
            },
            async healDamage(amount) {
                this.damage = Math.max(0, this.damage - amount);
            },
            async refresh() {},
            toObj() {
                return {id: this.id, name: this.name};
            },
        }));
        const match = {
            friends: characters,
            scenario: {},
            villain: {stage: 4},
        };
        const effect = gameCard.abilities[0].effect;
        effect.match = match;
        effect.validTarget.match = match;

        const dialogs = [];
        effect.validTarget.openDialog = async ({data}) => {
            dialogs.push({
                count: data.count,
                minCount: data.minCount,
                upTo: data.upTo,
                candidateCount: data.cards.length,
            });
            const chosenCount = data.count === 3 ? 3 : 1;
            return {
                selected: characters.slice(0, chosenCount).map(({id}) => ({id})),
            };
        };

        const runAtStage = async stage => {
            match.villain.stage = stage;
            effect.resetResolutionState();
            const params = await effect.resolveParams({match, player});

            await effect.prepare(params);
            assert.equal(await effect.canRun(params), true);
            await effect.execute(params);
        };

        await runAtStage(4);
        assert.deepEqual(dialogs[0], {
            count: 3,
            minCount: 0,
            upTo: true,
            candidateCount: 4,
        });
        assert.deepEqual(
            characters.map(({damage}) => damage),
            [1, 1, 1, 2, 0]
        );

        characters.forEach(character => {
            if (character.id !== 'friendly-4') {
                character.damage = 2;
            }
        });
        await runAtStage(2);
        assert.deepEqual(dialogs[1], {
            count: 2,
            minCount: 0,
            upTo: true,
            candidateCount: 4,
        });
        assert.deepEqual(
            characters.map(({damage}) => damage),
            [1, 2, 2, 2, 0]
        );
    });
});
