import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {TRIGGER_THIS_THWARTS} from 'mc-shared';
import {AttackBasicAbility} from '../../src/abilities/basic/attack-basic-ability.js';
import {ActivationsFactory} from '../../src/factory/activations/activations-factory.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {EffectsFactory} from '../../src/factory/effects/effects-factory.js';
import {DealConsequencialDamageEffect} from '../../src/effects/deal-consequencial-damage-effect.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import basicAllies from '../../../mc-data/seed/catalog/aspects/basic/allies.js';
import msMarvel from '../../../mc-data/seed/catalog/heroes/ms-marvel.js';

describe('ally consequential damage', () => {
    test('Mockingbird suffers consequential damage when its attack defeats a villain stage', async () => {
        const match = {
            enemies: [],
            villain: null,
            triggerCards: {},
        };
        const nextVillain = {
            isEnemy: true,
            isInPlay: true,
            isTough: false,
            isVillain: true,
            name: 'Rino',
            async refresh() {},
        };
        const villain = {
            damage: 0,
            isEnemy: true,
            isInPlay: true,
            isTough: false,
            isVillain: true,
            name: 'Rino',
            canBeAttacked: () => true,
            async getLife() {
                return 1 - this.damage;
            },
            async defeat() {
                match.villain = nextVillain;
            },
            placeDamage(damage) {
                this.damage += damage;
            },
            async refresh() {},
        };
        match.enemies = [villain];
        match.villain = villain;
        match.scenario = {
            async announceVillainDefeat(defeatedVillain) {
                assert.equal(defeatedVillain, villain);
            },
        };
        const cardsFactory = new CardsFactory({match});
        match.activationsFactory = new ActivationsFactory(match);
        match.effectsFactory = new EffectsFactory(cardsFactory.abilitiesFactory);

        const mockingbirdConfig = basicAllies.find(({_id}) =>
            _id === 'basic-mockingbird');
        const printedCard = cardsFactory.createCard(structuredClone(mockingbirdConfig.card));
        const player = {
            gameZone: {
                async refresh() {},
            },
            canAttack: () => true,
        };
        const mockingbird = cardsFactory.createGameCard({card: printedCard});
        mockingbird.controller = player;
        let refreshCount = 0;
        let consequentialRefreshCompleted = false;
        mockingbird.refresh = async () => {
            const currentRefresh = ++refreshCount;
            await new Promise(resolve => setTimeout(resolve, 0));

            if (currentRefresh === 2) {
                consequentialRefreshCompleted = true;
            }
        };

        const attackAbility = mockingbird.abilities.find(ability =>
            ability instanceof AttackBasicAbility);

        await mockingbird.resolveAbility({
            abilityIndex: mockingbird.abilities.indexOf(attackAbility),
            player,
        });

        assert.equal(villain.damage, 1);
        assert.equal(match.villain, nextVillain);
        assert.equal(mockingbird.damage, 1);
        assert.equal(mockingbird.life, 2);
        assert.equal(consequentialRefreshCompleted, true);
    });

    test('Puñal Rojo suffers consequential damage when it attacks', async () => {
        const match = {
            enemies: [],
            villain: null,
            triggerCards: {},
        };
        const villain = {
            damage: 0,
            isEnemy: true,
            isInPlay: true,
            isTough: false,
            isVillain: true,
            name: 'Rino',
            canBeAttacked: () => true,
            async getLife() {
                return 10 - this.damage;
            },
            async defeat() {},
            placeDamage(damage) {
                this.damage += damage;
            },
            async refresh() {},
        };
        match.enemies = [villain];
        match.villain = villain;
        const cardsFactory = new CardsFactory({match});
        match.activationsFactory = new ActivationsFactory(match);
        match.effectsFactory = new EffectsFactory(cardsFactory.abilitiesFactory);

        const redDaggerConfig = msMarvel.config.cards.find(({card}) =>
            card.params.name === 'Puñal Rojo');
        assert.ok(redDaggerConfig);
        const printedCard = cardsFactory.createCard(
            structuredClone(redDaggerConfig.card)
        );
        const player = {
            gameZone: {
                async refresh() {},
            },
            canAttack: () => true,
        };
        const redDagger = cardsFactory.createGameCard({card: printedCard});
        redDagger.controller = player;
        redDagger.refresh = async () => {};

        const attackAbility = redDagger.abilities.find(ability =>
            ability instanceof AttackBasicAbility);
        assert.ok(attackAbility);

        await redDagger.resolveAbility({
            abilityIndex: redDagger.abilities.indexOf(attackAbility),
            player,
        });

        assert.equal(villain.damage, 2);
        assert.equal(redDagger.damage, 1);
    });

    test('consequential damage does not reopen the thwart response window', async () => {
        let takeDamageParams;
        const match = {
            effectsFactory: {
                createEffect(params) {
                    takeDamageParams = params;
                    return {
                        defeated: false,
                        takenDamage: 1,
                        async runEffect() {},
                    };
                },
            },
        };
        match.activationsFactory = new ActivationsFactory(match);

        const character = {isAlly: true};
        const ability = {isThwart: true};
        const effect = new DealConsequencialDamageEffect({
            ability,
            character,
            damage: 1,
            match,
            selectedTarget: character,
        });
        effect.damage = 1;
        effect.distributeDamage = async () => {};

        assert.equal(effect.isConsequential, true);
        assert.ok(!effect.getTriggersInit({}).includes(TRIGGER_THIS_THWARTS));
        assert.ok(!effect.getTriggersEnds({}).includes(TRIGGER_THIS_THWARTS));

        await effect.execute({});

        assert.equal(takeDamageParams.damage, 1);
        assert.equal(takeDamageParams.isConsequential, true);
        assert.equal(takeDamageParams.suppressAbilityThwart, true);
        const takeDamageEffect = new TakeDamageEffect({
            ...takeDamageParams,
            match,
        });
        assert.ok(
            !takeDamageEffect.getTriggersInit({}).includes(TRIGGER_THIS_THWARTS)
        );
        assert.ok(
            !takeDamageEffect.getTriggersEnds({}).includes(TRIGGER_THIS_THWARTS)
        );
    });
});
