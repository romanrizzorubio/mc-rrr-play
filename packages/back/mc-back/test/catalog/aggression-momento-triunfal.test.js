import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_RESPONSE,
    CARD_TYPE_EVENT,
    CLASSIFICATION_AGGRESSION,
    EFFECT_HEAL,
    RESOURCE_ENERGY,
    TARGET_YOUR_HERO,
    TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY,
} from 'mc-shared';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {Attack} from '../../src/activations/attack.js';
import {HeroResponseAbility} from '../../src/abilities/response/hero-response-ability.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {HealEffect} from '../../src/effects/heal-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

describe('Momento triunfal', () => {
    test('is in the shared Aggression collection and no hero precon', async () => {
        const catalog = await loadCatalog();
        const cardConfig = catalog.aspects.find(({_id}) =>
            _id === 'aggression-momento-triunfal');

        assert.ok(cardConfig);
        assert.equal(cardConfig.aspect, CLASSIFICATION_AGGRESSION);
        assert.equal(cardConfig.card.type, CARD_TYPE_EVENT);
        assert.equal(cardConfig.card.params.name, 'Momento triunfal');
        assert.equal(
            cardConfig.card.params.set,
            CLASSIFICATION_AGGRESSION
        );
        assert.equal(
            cardConfig.card.params.image,
            'aspect/aggression/events/12030.png'
        );
        assert.equal(cardConfig.card.params.cost, 0);
        assert.deepEqual(cardConfig.card.params.resources, [RESOURCE_ENERGY]);
        assert.equal(
            cardConfig.card.params.classification,
            CLASSIFICATION_AGGRESSION
        );

        const preconIds = catalog.heroes.flatMap(({config}) =>
            config.precon.flatMap(({cardRefs = []}) =>
                cardRefs.map(({id}) => id)
            )
        );
        assert.equal(preconIds.includes(cardConfig._id), false);
    });

    test('heals for the overkill damage from the hero attack that defeats an enemy', async () => {
        const catalog = await loadCatalog();
        const cardConfig = catalog.aspects.find(({_id}) =>
            _id === 'aggression-momento-triunfal');
        const match = {
            currentRound: 1,
            dialogs: [],
            inPlayCards: [],
            lasting: [],
            limits: {},
            players: [],
            scenario: {},
            triggerCards: {},
            async openDialog(dialog) {
                this.dialogs.push(dialog);

                return {selected: dialog.data.cards[0]};
            },
        };
        const cardsFactory = new CardsFactory({match});
        match.effectsFactory = cardsFactory.abilitiesFactory.effectsFactory;

        const card = cardsFactory.createGameCardFromConfig(cardConfig.card);
        const [ability] = card.abilities;
        const {effect} = ability;
        const heroCharacter = {
            canHeal: true,
            damage: 3,
            async refresh() {},
            healDamage(amount) {
                this.damage = Math.max(0, this.damage - amount);
            },
        };
        const player = {
            isHero: true,
            superhero: {currentSide: heroCharacter},
        };
        const enemy = {isEnemy: true};
        const attack = new Attack({
            effect: {
                ability: {isBasic: true},
                character: heroCharacter,
                isAttack: true,
                match,
                selectedTarget: enemy,
            },
        });
        const defeatEffect = new DefeatEffect({
            activation: attack,
            match,
            selectedTarget: enemy,
        });

        assert.equal(cardConfig.card.params.abilities[0].type, ABILITY_HERO_RESPONSE);
        assert.equal(
            cardConfig.card.params.abilities[0].params.trigger,
            TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY
        );
        assert.equal(
            cardConfig.card.params.abilities[0].params.effect.type,
            EFFECT_HEAL
        );
        assert.ok(ability instanceof HeroResponseAbility);
        assert.equal(ability.trigger, TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY);
        assert.ok(effect instanceof HealEffect);
        assert.equal(typeof effect.canRun, 'function');
        assert.equal(effect.target, TARGET_YOUR_HERO);
        assert.deepEqual(effect.paramsCalc, {target: 'attack.excessDamage'});
        effect.selectedTarget = heroCharacter;

        attack.excessDamage = 0;
        const noOverkillParams = defeatEffect.getTriggersParams({match, player});
        assert.strictEqual(noOverkillParams.attack, attack);
        assert.equal(await effect.canRun(noOverkillParams), false);
        assert.equal(heroCharacter.damage, 3);

        attack.excessDamage = 2;
        const overkillParams = defeatEffect.getTriggersParams({match, player});
        assert.strictEqual(overkillParams.attack, attack);
        assert.equal(await effect.canRun(overkillParams), true);
        await effect.runEffect(overkillParams);
        assert.equal(heroCharacter.damage, 1);
    });
});
