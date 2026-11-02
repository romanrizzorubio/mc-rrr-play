import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CALC_COUNT,
    CARD_TYPE_EVENT,
    CLASSIFICATION_LEADERSHIP,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_EXHAUST,
    EFFECT_TAKE_DAMAGE,
    LABEL_ATTACK,
    RESOURCE_ENERGY,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ENEMY,
    TRAIT_AVENGER,
    TRAIT_ATTACK,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {ExhaustEffect} from '../../src/effects/exhaust-effect.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';

describe('Todos para uno', () => {
    const createCharacter = (id, traits, exhausted = false) => ({
        id,
        name: id,
        traits,
        exhausted,
        exhaust() {
            this.exhausted = true;
        },
        async refresh() {},
        toObj() {
            return {id: this.id, name: this.name};
        },
    });

    const createContext = async selectedCount => {
        const {aspects} = await loadCatalog();
        const definition = aspects.find(({_id}) =>
            _id === 'leadership-todos-para-uno');
        const avengerOne = createCharacter('avenger-one', [TRAIT_AVENGER]);
        const avengerTwo = createCharacter('avenger-two', [TRAIT_AVENGER]);
        const nonAvenger = createCharacter('non-avenger', []);
        const exhaustedAvenger = createCharacter(
            'exhausted-avenger',
            [TRAIT_AVENGER],
            true
        );
        const friends = [
            avengerOne,
            avengerTwo,
            nonAvenger,
            exhaustedAvenger,
        ];
        const enemy = {
            id: 'enemy',
            name: 'Villano',
            isEnemy: true,
            isVillain: true,
            isInPlay: true,
            damage: 0,
            abilities: [],
            canBeAttacked() {
                return true;
            },
            async getLife() {
                return 20 - this.damage;
            },
            placeDamage(damage) {
                this.damage += damage;
            },
            async refresh() {},
            toObj() {
                return {id: this.id, name: this.name};
            },
        };
        const match = {
            players: [],
            triggerCards: {},
            villain: enemy,
            async openDialog(dialog) {
                this.selectionDialog = dialog;

                return {
                    selected: dialog.data.cards.slice(0, selectedCount),
                };
            },
        };
        const matchFactory = new MatchFactory(match);
        const player = {
            isHero: true,
            isPlayer: true,
            name: 'Jugador',
            match,
            friends,
            hand: {cards: []},
            superhero: {},
        };
        match.players.push(player);

        const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player}
        );
        const [ability] = gameCard.abilities;

        return {
            ability,
            avengerOne,
            avengerTwo,
            definition,
            enemy,
            exhaustedAvenger,
            gameCard,
            match,
            nonAvenger,
            player,
        };
    };

    test('registers as a shared Leadership event without precon references', async () => {
        const {aspects, heroes} = await loadCatalog();
        const definition = aspects.find(({_id}) =>
            _id === 'leadership-todos-para-uno');

        assert.ok(definition);
        assert.equal(definition.aspect, CLASSIFICATION_LEADERSHIP);
        assert.equal(definition.card.type, CARD_TYPE_EVENT);
        assert.equal(definition.card.params.name, 'Todos para uno');
        assert.equal(
            definition.card.params.set,
            CLASSIFICATION_LEADERSHIP
        );
        assert.equal(
            definition.card.params.image,
            'aspect/leadership/events/13032.png'
        );
        assert.deepEqual(definition.card.params.traits, [TRAIT_ATTACK]);
        assert.equal(definition.card.params.cost, 2);
        assert.deepEqual(
            definition.card.params.resources,
            [RESOURCE_ENERGY]
        );
        assert.equal(
            definition.card.params.classification,
            CLASSIFICATION_LEADERSHIP
        );

        const preconIds = heroes.flatMap(({config}) =>
            (config.precon ?? []).flatMap(({cardRefs = []}) =>
                cardRefs.map(({id}) => id)
            )
        );
        assert.equal(preconIds.includes(definition._id), false);

        const [abilityConfig] = definition.card.params.abilities;
        assert.equal(abilityConfig.type, ABILITY_HERO_ACTION);
        assert.deepEqual(abilityConfig.params.labels, [LABEL_ATTACK]);
        assert.deepEqual(abilityConfig.params.effect, {
            type: EFFECT_CHAINED,
            params: {
                target: TARGET_ENEMY,
                effects: [
                    {
                        type: EFFECT_EXHAUST,
                        params: {
                            target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                            condition: {traits: TRAIT_AVENGER},
                            multipleTarget: true,
                            selectUpTo: true,
                        },
                    },
                    {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {
                            target: TARGET_ENEMY,
                            damage: 3,
                            additionalDamageCalc: {
                                target: 'effects.0.selectedTarget',
                                formula: CALC_COUNT,
                            },
                        },
                    },
                ],
            },
        });

        const matchFactory = new MatchFactory({
            players: [],
            triggerCards: {},
        });
        const player = {
            isHero: true,
            isPlayer: true,
            superhero: {},
        };
        const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player}
        );
        const [ability] = gameCard.abilities;

        assert.equal(ability.isAttack, true);
        assert.ok(ability.effect instanceof ChainedEffect);
        assert.ok(ability.effect.effects[0] instanceof ExhaustEffect);
        assert.ok(ability.effect.effects[1] instanceof DealDamageEffect);
        assert.equal(typeof ability.effect.canRun, 'function');
    });

    test('adds one damage per ready Avenger exhausted, including a choice of zero', async () => {
        for (const {selectedCount, expectedDamage} of [
            {selectedCount: 2, expectedDamage: 5},
            {selectedCount: 0, expectedDamage: 3},
        ]) {
            const context = await createContext(selectedCount);
            const {
                ability,
                avengerOne,
                avengerTwo,
                enemy,
                exhaustedAvenger,
                gameCard,
                match,
                player,
                nonAvenger,
            } = context;
            const {effect} = ability;
            effect.selectedTarget = enemy;

            let damageCall;
            const effectsFactory = match.effectsFactory;
            match.effectsFactory = {
                ...effectsFactory,
                createEffect({type, damage, selectedTarget, ...params}) {
                    if (type !== EFFECT_TAKE_DAMAGE) {
                        return effectsFactory.createEffect({
                            type,
                            damage,
                            selectedTarget,
                            ...params,
                        });
                    }

                    return {
                        takenDamage: damage,
                        defeated: false,
                        async runEffect() {
                            damageCall = {damage, selectedTarget};
                            selectedTarget.damage += damage;
                        },
                    };
                },
            };

            await effect.runEffect({
                ability,
                card: gameCard,
                effects: effect.effects,
                match,
                player,
            });

            assert.deepEqual(
                match.selectionDialog.data.cards.map(({id}) => id),
                ['avenger-one', 'avenger-two']
            );
            assert.equal(avengerOne.exhausted, selectedCount > 0);
            assert.equal(avengerTwo.exhausted, selectedCount > 1);
            assert.equal(nonAvenger.exhausted, false);
            assert.equal(exhaustedAvenger.exhausted, true);
            assert.deepEqual(damageCall, {
                damage: expectedDamage,
                selectedTarget: enemy,
            });
            assert.equal(enemy.damage, expectedDamage);
        }
    });
});
