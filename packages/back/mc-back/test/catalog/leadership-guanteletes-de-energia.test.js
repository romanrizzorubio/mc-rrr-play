import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_RESPONSE,
    CARD_TYPE_ALLY,
    CARD_TYPE_MINION,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_LEADERSHIP,
    DIALOG_USE_CARD,
    EFFECT_DEAL_DAMAGE,
    PRIORITY_RESPONSE,
    RESOURCE_MENTAL,
    TARGET_ALLY,
    TARGET_DECK,
    TARGET_ENEMY,
    TRAIT_ARMOR,
    TRAIT_AVENGER,
    TRAIT_TECH,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_THWARTS,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {Attack} from '../../src/activations/attack.js';
import {Thwart} from '../../src/activations/thwart.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

describe('Guanteletes de energía', () => {
    test('defines the upgrade and includes three copies in the Ant-Man precon', async () => {
        const catalog = await loadCatalog();
        const antMan = catalog.heroes.find(({_id}) => _id === 'ant-man');
        const gauntlets = catalog.aspects.find(({_id}) =>
            _id === 'leadership-guanteletes-de-energia');

        assert.ok(antMan);
        assert.ok(gauntlets);
        assert.equal(gauntlets.aspect, CLASSIFICATION_LEADERSHIP);
        assert.equal(gauntlets.card.type, CARD_TYPE_UPGRADE);
        assert.equal(gauntlets.card.params.name, 'Guanteletes de energía');
        assert.equal(
            gauntlets.card.params.image,
            'aspect/leadership/upgrades/12017.png',
        );
        assert.deepEqual(gauntlets.card.params.traits, [TRAIT_ARMOR, TRAIT_TECH]);
        assert.equal(gauntlets.card.params.cost, 1);
        assert.deepEqual(gauntlets.card.params.resources, [RESOURCE_MENTAL]);
        assert.equal(gauntlets.card.params.classification, CLASSIFICATION_LEADERSHIP);
        assert.deepEqual(gauntlets.card.params.attach, {
            target: TARGET_ALLY,
            condition: {traits: TRAIT_AVENGER},
        });
        assert.equal(gauntlets.card.params.maxAttach, 1);
        assert.deepEqual(gauntlets.card.params.maximum, {
            count: 3,
            target: TARGET_DECK,
        });

        const precon = antMan.config.precon.find(({aspect}) =>
            aspect === CLASSIFICATION_LEADERSHIP);
        assert.ok(precon);
        assert.ok(precon.cardRefs.some(({id, count}) =>
            id === gauntlets._id && count === 3));

        assert.deepEqual(
            gauntlets.card.params.abilities.map(({type, params}) => ({
                type,
                trigger: params.trigger,
                effect: params.effect,
            })),
            [
                {
                    type: ABILITY_RESPONSE,
                    trigger: TRIGGER_THIS_ATTACK,
                    effect: {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {target: TARGET_ENEMY, damage: 1},
                    },
                },
                {
                    type: ABILITY_RESPONSE,
                    trigger: TRIGGER_THIS_THWARTS,
                    effect: {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {target: TARGET_ENEMY, damage: 1},
                    },
                },
            ],
        );
    });

    test('deals one damage after the attached ally attacks or thwarts', async () => {
        const catalog = await loadCatalog();
        const antMan = catalog.heroes.find(({_id}) => _id === 'ant-man');
        const definition = catalog.aspects.find(({_id}) =>
            _id === 'leadership-guanteletes-de-energia');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'leadership-guanteletes-de-energia',
        });
        match.scenario = {
            villain: undefined,
            gameZone: {
                cards: [],
                currentScheme: undefined,
                currentVillain: undefined,
            },
        };
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...antMan.config,
            cards: [],
            precon: [],
        });
        const player = match.createPlayer({
            name: 'Hombre Hormiga',
            superhero,
            initial: true,
        });
        player.gameZone = new PlayerZone({owner: player});
        player.gameZone.refresh = async () => {};
        player.hand = {cards: [], async refresh() {}};
        player.refresh = async () => {};

        const ally = matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {
                name: 'Aliado Vengador',
                traits: [TRAIT_AVENGER],
                attack: 1,
                thwart: 1,
                hitPoints: 3,
            },
        }, {owner: player});
        ally.controller = player;
        ally.refresh = async () => {};
        player.gameZone.addToGameZone(ally);

        const nonAvenger = matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {
                name: 'Aliado sin rasgo Vengador',
                attack: 1,
                thwart: 1,
                hitPoints: 3,
            },
        }, {owner: player});
        nonAvenger.controller = player;
        nonAvenger.refresh = async () => {};
        player.gameZone.addToGameZone(nonAvenger);

        const enemy = matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {
                name: 'Esbirro de prueba',
                attack: 1,
                scheme: 1,
                hitPoints: 8,
            },
        }, {owner: match.scenario});
        enemy.controller = match.scenario;
        enemy.refresh = async () => {};
        match.scenario.villain = enemy;
        match.scenario.gameZone.currentVillain = enemy;

        const gauntlets = matchFactory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player},
        );
        gauntlets.controller = player;
        gauntlets.refresh = async () => {};
        const attachEffect = gauntlets.card.createAttachEffect(gauntlets);
        assert.deepEqual(
            await attachEffect.getValidTarget({match, player}),
            [ally],
        );
        attachEffect.selectedTarget = ally;
        await attachEffect.execute({match, player});
        await gauntlets.initTriggers({player});

        const duplicate = matchFactory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player},
        );
        const duplicateAttachEffect = duplicate.card.createAttachEffect(duplicate);
        assert.deepEqual(
            await duplicateAttachEffect.getValidTarget({match, player}),
            [],
        );

        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            return dialog.dialogType === DIALOG_USE_CARD ?
                {selected: {id: gauntlets.id}} :
                {};
        };

        const attackEffect = {
            isAttack: true,
            ability: {card: ally, isBasic: true},
            character: ally,
            match,
            selectedTarget: enemy,
        };
        const attack = new Attack({effect: attackEffect});
        const attackParams = attack.getTriggersParams({
            effect: attackEffect,
            match,
            player,
        });
        const attackTrigger = gauntlets.triggers[TRIGGER_THIS_ATTACK][PRIORITY_RESPONSE][0];

        assert.ok(attack.getTriggersEnds(attackParams).includes(TRIGGER_THIS_ATTACK));
        assert.equal(await attackTrigger.canTrigger(attackParams), true);
        await attack.trigger(PRIORITY_RESPONSE, [TRIGGER_THIS_ATTACK], attackParams);
        assert.equal(enemy.damage, 1);

        const thwartEffect = {
            isAttack: false,
            ability: {card: ally, isBasic: true},
            character: ally,
            match,
        };
        const thwart = new Thwart({effect: thwartEffect});
        const thwartParams = thwart.getTriggersParams({
            effect: thwartEffect,
            match,
            player,
        });
        const thwartTrigger = gauntlets.triggers[TRIGGER_THIS_THWARTS][PRIORITY_RESPONSE][0];

        assert.ok(thwart.getTriggersEnds(thwartParams).includes(TRIGGER_THIS_THWARTS));
        assert.equal(await thwartTrigger.canTrigger(thwartParams), true);
        await thwart.trigger(PRIORITY_RESPONSE, [TRIGGER_THIS_THWARTS], thwartParams);
        assert.equal(enemy.damage, 2);
        assert.equal(dialogs.filter(({dialogType}) =>
            dialogType === DIALOG_USE_CARD).length, 2);
    });
});
