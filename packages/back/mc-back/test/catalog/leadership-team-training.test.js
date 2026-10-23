import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_CONSTANT,
    CARD_TYPE_ALLY,
    CARD_TYPE_SUPPORT,
    DIALOG_SELECT_TARGET,
    EFFECT_MODIFY_HIT_POINTS,
    RESOURCE_PHYSICAL,
    TARGET_ALL_ALLIES_YOU_CONTROL,
    TARGET_ANY_PLAYER,
    TARGET_PLAYER,
    TRAIT_CONDITION,
    TRIGGER_CHARACTER_GET_HIT_POINTS,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

describe('Entrenamiento en equipo', () => {
    test('defines the supplied Leadership support and includes three copies in the Hawkeye precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const training = aspects.find(({_id}) =>
            _id === 'leadership-entrenamiento-en-equipo');
        const hawkeye = heroes.find(({_id}) => _id === 'hawkeye');

        assert.ok(training);
        assert.ok(hawkeye);
        assert.equal(training.aspect, 'leadership');
        assert.equal(training.card.type, CARD_TYPE_SUPPORT);
        assert.equal(training.card.params.name, 'Entrenamiento en equipo');
        assert.equal(
            training.card.params.image,
            'aspect/leadership/supports/04016.png',
        );
        assert.deepEqual(training.card.params.traits, [TRAIT_CONDITION]);
        assert.equal(training.card.params.cost, 2);
        assert.deepEqual(training.card.params.resources, [RESOURCE_PHYSICAL]);
        assert.equal(training.card.params.controllerTarget, TARGET_ANY_PLAYER);
        assert.deepEqual(training.card.params.maximum, {
            count: 1,
            target: TARGET_PLAYER,
        });

        const [ability] = training.card.params.abilities;
        assert.equal(ability.type, ABILITY_CONSTANT);
        assert.equal(ability.params.trigger, TRIGGER_CHARACTER_GET_HIT_POINTS);
        assert.deepEqual(ability.params.effect, {
            type: EFFECT_MODIFY_HIT_POINTS,
            params: {
                target: TARGET_ALL_ALLIES_YOU_CONTROL,
                count: 1,
            },
        });

        const reference = hawkeye.config.precon
            .find(({aspect}) => aspect === 'leadership')
            .cardRefs.find(({id}) => id === training._id);
        assert.deepEqual(reference, {id: training._id, count: 3});
    });

    test('allows choosing another controller, limits one copy per player, and boosts only that player\'s allies', async () => {
        const catalog = await loadCatalog();
        const trainingConfig = catalog.aspects.find(({_id}) =>
            _id === 'leadership-entrenamiento-en-equipo');
        const hawkeye = catalog.heroes.find(({_id}) => _id === 'hawkeye');
        const thor = catalog.heroes.find(({_id}) => _id === 'thor');
        assert.ok(trainingConfig);
        assert.ok(hawkeye);
        assert.ok(thor);

        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'leadership-team-training',
        });
        match.scenario = {
            villain: undefined,
            gameZone: {
                currentScheme: undefined,
                cards: [],
            },
        };
        const matchFactory = new MatchFactory(match);
        let targetDialog;
        match.openDialog = async dialog => {
            targetDialog = dialog;

            return {
                selected: dialog.data.cards.find(({id}) => id === controller.id),
            };
        };
        const createPlayer = (name, heroConfig, initial = false) => {
            const superhero = matchFactory.createSuperhero(heroConfig);
            const player = match.createPlayer({name, superhero, initial});
            player.gameZone = new PlayerZone({owner: player});
            player.gameZone.refresh = async () => {};
            player.hand.refresh = async () => {};

            return player;
        };
        const owner = createPlayer('Hawkeye', hawkeye.config, true);
        const controller = createPlayer('Thor', thor.config);
        owner.deck = {async discard() {}};

        const training = matchFactory.cardsFactory.createGameCardFromConfig(
            trainingConfig.card,
            {index: 1, owner},
        );
        training.refresh = async () => {};
        assert.equal(Array.isArray(training.abilities[0].effect), false);
        assert.equal(typeof training.abilities[0].effect.canRun, 'function');
        owner.hand.cards.push(training);

        const playTargets = await owner.hand.getPlayTargets(training);
        assert.deepEqual(playTargets.playableTargetIds, []);
        assert.equal(playTargets.playableInGameZone, true);

        const playEffect = new PlayCardEffect({
            card: training,
            match,
        });
        assert.equal(playEffect.target, TARGET_ANY_PLAYER);
        assert.deepEqual(
            await playEffect.getValidTarget({match, player: owner}),
            [owner, controller],
        );
        await playEffect.prepare({match, player: owner});
        assert.equal(targetDialog.dialogType, DIALOG_SELECT_TARGET);
        assert.deepEqual(
            targetDialog.data.cards.map(({id, name, isPlayer}) => ({
                id,
                name,
                isPlayer,
            })),
            [
                {id: owner.id, name: owner.name, isPlayer: true},
                {id: controller.id, name: controller.name, isPlayer: true},
            ],
        );
        assert.equal('deck' in targetDialog.data.cards[0], false);
        assert.equal('superhero' in targetDialog.data.cards[0], false);
        assert.equal(playEffect.selectedTarget, controller);
        await playEffect.doPlay({match, player: owner});
        assert.equal(training.controller, controller);
        assert.ok(controller.supports.includes(training));

        const duplicate = matchFactory.cardsFactory.createGameCardFromConfig(
            trainingConfig.card,
            {index: 2, owner},
        );
        const duplicatePlayEffect = new PlayCardEffect({
            card: duplicate,
            match,
        });
        assert.deepEqual(
            await duplicatePlayEffect.getValidTarget({match, player: owner}),
            [owner],
        );

        const createAlly = (player, name, index) => {
            const ally = matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_ALLY,
                params: {
                    name,
                    hitPoints: 2,
                    attack: 1,
                    thwart: 1,
                },
            }, {index, owner: player});
            ally.controller = player;
            ally.refresh = async () => {};
            player.gameZone.addToGameZone(ally);

            return ally;
        };
        const ownerAlly = createAlly(owner, 'Aliado de Hawkeye', 1);
        const controllerAlly = createAlly(controller, 'Aliado de Thor', 1);

        assert.equal(await ownerAlly.getHitPoints({player: owner}), 2);
        assert.equal(await controllerAlly.getHitPoints({player: controller}), 3);

        await training.discard();
        assert.equal(await controllerAlly.getHitPoints({player: controller}), 2);
    });
});
