import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    EFFECT_HEAL,
    EFFECT_READY,
    RESOURCE_MENTAL,
    TARGET_ALLY,
    TARGET_PARENT,
    TRAIT_AVENGER,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {PlayerCard} from '../../src/model/printed/player-card.js';
import {SimultaneousEffect} from '../../src/effects/simultaneous-effect.js';

describe('Presencia inspiradora', () => {
    test('is a shared Leadership event and compiles correctly', async () => {
        const {aspects, heroes} = await loadCatalog();
        const cardConfig = aspects.find(({_id}) =>
            _id === 'leadership-presencia-inspiradora');

        assert.ok(cardConfig);
        assert.equal(cardConfig.aspect, 'leadership');
        assert.equal(
            heroes.some(({config}) => config.precon?.some(({cardRefs = []}) =>
                cardRefs.some(({id}) => id === cardConfig._id))),
            false
        );

        const {card} = cardConfig;
        assert.equal(card.params.name, 'Presencia inspiradora');
        assert.equal(card.params.set, 'leadership');
        assert.equal(card.params.image, 'aspect/leadership/events/10030.png');
        assert.equal(card.params.cost, 1);
        assert.deepEqual(card.params.resources, [RESOURCE_MENTAL]);
        assert.deepEqual(card.params.paramsToPlay, {
            'superhero.traits': TRAIT_AVENGER
        });

        const player = {
            hand: {cards: []},
            superhero: {traits: [TRAIT_AVENGER]},
        };
        const matchFactory = new MatchFactory({
            triggerCards: {},
            isUniqueCard: () => false,
        });
        const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(
            card,
            {owner: player}
        );
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

        assert.equal(card.params.abilities[0].type, ABILITY_HERO_ACTION);
        const [ability] = gameCard.abilities;
        assert.ok(ability.effect instanceof SimultaneousEffect);
        assert.equal(typeof ability.effect.canRun, 'function');
        assert.equal(ability.effect.target, TARGET_ALLY);
        assert.deepEqual(
            ability.effect.effects.map(effect => effect.effectType),
            [EFFECT_HEAL, EFFECT_READY]
        );
        assert.equal(ability.effect.effects[0].damage, 1);
        assert.ok(ability.effect.effects.every(({target}) =>
            target === TARGET_PARENT));
    });

    test('asks once and applies the selected ally to both effects', async () => {
        const {aspects} = await loadCatalog();
        const cardConfig = aspects.find(({_id}) =>
            _id === 'leadership-presencia-inspiradora');
        const player = {
            id: 'player',
            isPlayer: true,
            isHero: true,
            allies: [],
        };
        const makeAlly = id => ({
            id,
            name: id,
            owner: player,
            damage: 1,
            exhausted: true,
            get canHeal() {
                return this.damage > 0;
            },
            async healDamage(amount) {
                this.damage = Math.max(0, this.damage - amount);
            },
            async ready() {
                this.exhausted = false;
            },
            async refresh() {},
            toObj() {
                return {id: this.id, name: this.name};
            },
        });
        const allies = ['ally-1', 'ally-2', 'ally-3'].map(makeAlly);
        player.allies = allies;
        const selectedAlly = allies[1];
        const dialogs = [];
        const match = {
            triggerCards: {},
            isUniqueCard: () => false,
            openDialog: async dialog => {
                dialogs.push(dialog);

                return {selected: {id: selectedAlly.id}};
            },
        };
        const matchFactory = new MatchFactory(match);
        const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(
            cardConfig.card,
            {owner: player}
        );
        const [ability] = gameCard.abilities;
        const prepared = await ability.prepareToResolve({match, player});

        assert.equal(prepared.canRun, true);
        assert.equal(prepared.preselectedTarget, true);
        assert.strictEqual(ability.effect.selectedTarget, selectedAlly);

        await ability.resolveAbility({
            match,
            player,
            arrowPaid: true,
            ...prepared,
        });

        assert.equal(dialogs.length, 1);
        assert.equal(dialogs[0].data.cards.length, allies.length);
        assert.deepEqual(
            allies.map(({damage, exhausted}) => ({damage, exhausted})),
            [
                {damage: 1, exhausted: true},
                {damage: 0, exhausted: false},
                {damage: 1, exhausted: true},
            ]
        );
    });
});
