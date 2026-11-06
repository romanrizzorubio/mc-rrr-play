import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_INTERRUPT,
    CARD_TYPE_ALLY,
    CARD_TYPE_EVENT,
    CLASSIFICATION_LEADERSHIP,
    DIALOG_USE_CARD,
    EFFECT_DELAYED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_GAME,
    EFFECT_MODIFY_ATTACK_VALUE,
    RESOURCE_MENTAL,
    TARGET_EFFECT,
    TARGET_SOURCE,
    TARGET_VILLAIN,
    TRAIT_TACTIC,
    TRIGGER_YOU_ANY_ATTACK,
    TRIGGER_YOU_ALLY_ATTACK,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import msMarvel from '../../../mc-data/seed/catalog/heroes/ms-marvel.js';
import leadershipEvents from '../../../mc-data/seed/catalog/aspects/leadership/events.js';
import rhino from '../../../mc-data/seed/catalog/scenarios/rhino.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {YouAnyAttackTrigger} from '../../src/triggers/you-any-attack-trigger.js';
import {YouAllyAttackTrigger} from '../../src/triggers/you-ally-attack-trigger.js';

describe('Un último asalto', () => {
    async function createFixture() {
        const match = new Match({
            name: 'leadership-un-ultimo-asalto',
            mc: {mcSocket: {send() {}}},
        });
        match.persist = async () => {};
        match.refresh = async () => {};
        match.openDialog = async () => ({});
        const factory = new MatchFactory(match);
        const player = match.createPlayer({
            name: 'Ms. Marvel',
            initial: true,
            superhero: factory.createSuperhero({
                ...structuredClone(msMarvel.config),
                precon: [],
                obligation: undefined,
                nemesis: [],
            }),
        });
        player.initPlayer();
        player.superhero.selectedSide = 1;
        match.currentPlayer = player;
        const scenario = await factory.createScenario({
            ...structuredClone(rhino.config),
            cards: [],
            sets: [],
            defaultSets: [],
        });
        match.addScenario(scenario);
        await scenario.initScenario([], false);
        match.phase = 'player';
        match.playing = true;
        await player.superhero.initTriggers({player});

        const definition = leadershipEvents.find(({_id}) =>
            _id === 'leadership-un-ultimo-asalto');
        const event = factory.cardsFactory.createGameCardFromConfig(
            structuredClone(definition.card),
            {owner: player},
        );
        player.hand.addCard(event);

        const ally = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {
                name: 'Aliado de prueba',
                set: CLASSIFICATION_LEADERSHIP,
                cost: 0,
                resources: [RESOURCE_MENTAL],
                attack: 1,
                attackConsequential: 1,
                hitPoints: 4,
                abilities: [{
                    type: ABILITY_FORCED_RESPONSE,
                    params: {
                        trigger: TRIGGER_YOU_ALLY_ATTACK,
                        effect: {
                            type: EFFECT_DEAL_DAMAGE,
                            params: {
                                target: TARGET_VILLAIN,
                                damage: 1,
                            },
                        },
                    },
                }],
            },
        }, {owner: player});
        await new PutPlayEffect({
            match,
            card: ally,
            controller: player,
        }).runEffect({player, force: true});

        return {ally, event, match, player, scenario};
    }

    test('is a shared Leadership tactic and is not added to any precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const definition = aspects.find(({_id}) =>
            _id === 'leadership-un-ultimo-asalto');

        assert.ok(definition);
        assert.equal(definition.aspect, CLASSIFICATION_LEADERSHIP);
        assert.equal(definition.card.type, CARD_TYPE_EVENT);
        assert.equal(definition.card.params.name, 'Un último asalto');
        assert.equal(definition.card.params.set, CLASSIFICATION_LEADERSHIP);
        assert.equal(
            definition.card.params.image,
            'aspect/leadership/events/15029.png',
        );
        assert.deepEqual(definition.card.params.traits, [TRAIT_TACTIC]);
        assert.equal(definition.card.params.cost, 0);
        assert.deepEqual(definition.card.params.resources, [RESOURCE_MENTAL]);

        const ability = definition.card.params.abilities[0];
        assert.equal(ability.type, ABILITY_HERO_INTERRUPT);
        assert.equal(ability.params.trigger, TRIGGER_YOU_ALLY_ATTACK);
        assert.equal(ability.params.condition, undefined);
        assert.deepEqual(ability.params.effect.params.effects.map(({type}) => type), [
            EFFECT_MODIFY_ATTACK_VALUE,
            EFFECT_DELAYED,
        ]);
        assert.equal(
            ability.params.effect.params.effects[0].params.target,
            TARGET_EFFECT,
        );
        assert.equal(
            ability.params.effect.params.effects[1].params.effect.type,
            EFFECT_DISCARD_GAME,
        );
        assert.equal(
            ability.params.effect.params.effects[1].params.effect.params.target,
            TARGET_SOURCE,
        );
        assert.equal(
            ability.params.effect.params.effects[1].params.effect.params.source,
            'effect.character',
        );
        for (const hero of heroes) {
            const references = (hero.config.precon || [])
                .flatMap(({cardRefs = []}) => cardRefs);
            assert.equal(
                references.some(({id}) => id === definition._id),
                false,
                `${hero._id} unexpectedly references Un último asalto`,
            );
        }
    });

    test('adds 3 ATQ, resolves the Ally attack response, then discards it before consequential damage', async () => {
        const {ally, event, match, player, scenario} =
            await createFixture();
        const ability = event.abilities[0];
        const attack = ally.abilities.find(({isAttack, isBasic}) =>
            isAttack && isBasic);
        const dialogs = [];

        assert.ok(attack);
        assert.equal(typeof ability.effect.canRun, 'function');

        match.openDialog = async dialog => {
            dialogs.push(dialog);
            if (dialog.dialogType === DIALOG_USE_CARD) {
                const card = dialog.data.cards.find(({id}) =>
                    id === event.id || id === ally.id);
                if (card) {
                    return {selected: {id: card.id}};
                }
            }

            return {};
        };

        const trigger = new YouAllyAttackTrigger({
            ability,
            card: event,
            trigger: TRIGGER_YOU_ALLY_ATTACK,
        });
        const anyAttackTrigger = new YouAnyAttackTrigger({
            ability,
            card: event,
            trigger: TRIGGER_YOU_ANY_ATTACK,
        });
        const otherPlayer = {
            isPlayer: true,
            superhero: {currentSide: {isHero: true}},
        };
        const otherAlly = {controller: otherPlayer, isAlly: true};

        assert.equal(await trigger.canTrigger({
            effect: {character: ally, isAttack: true},
            player,
        }), true);
        assert.ok(!(await anyAttackTrigger.canTrigger({
            effect: {character: ally, isAttack: true},
            player,
        })));
        assert.ok(!(await trigger.canTrigger({
            effect: {character: player.superhero.currentSide, isAttack: true},
            player,
        })));
        assert.ok(!(await trigger.canTrigger({
            effect: {character: otherAlly, isAttack: true},
            player,
        })));

        await attack.resolveAbility({
            activationTarget: scenario.villain,
            card: ally,
            fixedPreselectedTarget: true,
            player,
            preselectedTarget: true,
            selectedTarget: scenario.villain,
        });

        assert.equal(scenario.villain.damage, 5);
        assert.ok(player.deck.discardPile.includes(event));
        assert.ok(player.deck.discardPile.includes(ally));
        assert.equal(player.gameZone.cards.includes(ally), false);
        assert.equal(ally.damage, 0);
        assert.equal(
            dialogs.some(dialog =>
                dialog.dialogType === DIALOG_USE_CARD &&
                dialog.data.cards.some(({id}) => id === ally.id)),
            true,
        );
    });
});
