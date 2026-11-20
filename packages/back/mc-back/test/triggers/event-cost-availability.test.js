import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_RESOURCE,
    CARD_TYPE_RESOURCE,
    DIALOG_PAY_COST,
    RESOURCE_ENERGY,
    RESOURCE_PHYSICAL,
    TRIGGER_YOU_BASIC_ATTACK,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {ResourceAbility} from '../../src/abilities/resource/resource-ability.js';
import {GetAttackEffect} from '../../src/effects/get-attack-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {Trigger} from '../../src/triggers/base/trigger.js';

describe('event trigger cost availability', () => {
    const createFixture = async () => {
        const catalog = await loadCatalog();
        const hero = catalog.heroes.find(({_id}) => _id === 'drax');
        assert.ok(hero);

        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'event-cost-availability-test',
        });
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);

            if (dialog.dialogType === DIALOG_PAY_COST) {
                return undefined;
            }

            return {
                selected: dialog.data?.cards?.[0] ??
                    dialog.data?.options?.[0] ??
                    {id: '0'},
            };
        };
        match.refresh = async () => {};
        match.persist = async () => {};
        const factory = new MatchFactory(match);
        const superhero = factory.createSuperhero({
            ...hero.config,
            cards: [],
            precon: [],
            obligation: undefined,
            nemesis: [],
        });
        superhero.refresh = async () => {};
        superhero.selectedSide = 1;
        const player = match.createPlayer({
            name: 'Drax',
            superhero,
            initial: true,
        });
        player.initPlayer();
        await superhero.initTriggers({match, player});

        return {dialogs, factory, hero, match, player, superhero};
    };

    const findFixedCard = (hero, name) =>
        hero.config.cards.find(({card}) => card.params.name === name).card;

    const addResource = (factory, player, resource, name) => {
        const card = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name,
                resources: [resource],
            },
        }, {owner: player});
        player.hand.addCard(card);

        return card;
    };

    const createTrigger = (card, ability) =>
        new Trigger({
            ability,
            card,
            trigger: ability.trigger,
        });

    test('only offers a hero interrupt when the event cost is payable', async () => {
        const {dialogs, factory, hero, match, player, superhero} =
            await createFixture();
        const event = factory.cardsFactory.createGameCardFromConfig(
            findFixedCard(hero, 'Salto y apuñalamiento'),
            {owner: player},
        );
        player.hand.addCard(event);
        const ability = event.abilities.find(({trigger}) =>
            trigger === TRIGGER_YOU_BASIC_ATTACK);
        const trigger = createTrigger(event, ability);
        const attack = new GetAttackEffect({
            match,
            selectedTarget: superhero.currentSide,
        });

        addResource(factory, player, RESOURCE_PHYSICAL, 'Physical 1');
        addResource(factory, player, RESOURCE_PHYSICAL, 'Physical 2');
        assert.equal(await trigger.canTrigger({effect: attack, player}), false);

        addResource(factory, player, RESOURCE_PHYSICAL, 'Physical 3');
        assert.equal(await trigger.canTrigger({effect: attack, player}), true);
        assert.equal(
            dialogs.some(dialog => dialog.dialogType === DIALOG_PAY_COST),
            false,
        );
    });

    test('uses cost reductions and legal resource generators for interrupts', async () => {
        const {dialogs, factory, hero, match, player, superhero} =
            await createFixture();
        const event = factory.cardsFactory.createGameCardFromConfig(
            findFixedCard(hero, 'Salto y apuñalamiento'),
            {owner: player},
        );
        player.hand.addCard(event);
        const ability = event.abilities.find(({trigger}) =>
            trigger === TRIGGER_YOU_BASIC_ATTACK);
        const trigger = createTrigger(event, ability);
        const attack = new GetAttackEffect({
            match,
            selectedTarget: superhero.currentSide,
        });

        superhero.placeCounters(2);
        assert.equal(await trigger.canTrigger({effect: attack, player}), false);

        const generator = new ResourceAbility({
            card: superhero.currentSide,
            match,
            resource: RESOURCE_PHYSICAL,
            abilityType: ABILITY_RESOURCE,
        });
        superhero.currentSide.abilities.push(generator);
        assert.equal(await trigger.canTrigger({effect: attack, player}), true);

        superhero.currentSide.abilities.splice(
            superhero.currentSide.abilities.indexOf(generator),
            1,
        );
        superhero.placeCounters(1);
        assert.equal(await trigger.canTrigger({effect: attack, player}), true);
        assert.equal(
            dialogs.some(dialog => dialog.dialogType === DIALOG_PAY_COST),
            false,
        );
    });

    test('plays the cost-reduced interrupt without offering resource payment', async () => {
        const {factory, hero, match, player, superhero, dialogs} =
            await createFixture();
        player.deck.checkCycle = async () => {};
        const event = factory.cardsFactory.createGameCardFromConfig(
            findFixedCard(hero, 'Salto y apuñalamiento'),
            {owner: player},
        );
        player.hand.addCard(event);
        superhero.placeCounters(3);
        const ability = event.abilities.find(({trigger}) =>
            trigger === TRIGGER_YOU_BASIC_ATTACK);
        const trigger = createTrigger(event, ability);
        const attack = new GetAttackEffect({
            match,
            selectedTarget: superhero.currentSide,
        });

        assert.equal(await trigger.canTrigger({effect: attack, player}), true);
        await trigger.runTrigger({effect: attack, player});

        assert.equal(trigger.triggered, true);
        assert.equal(player.deck.discardPile.includes(event), true);
        assert.equal(
            dialogs.some(dialog => dialog.dialogType === DIALOG_PAY_COST),
            false,
        );
    });

    test('only offers a hero response when the event cost is payable', async () => {
        const {dialogs, factory, hero, player} = await createFixture();
        const responseConfig = findFixedCard(hero, 'Vengar afrenta');
        const event = factory.cardsFactory.createGameCardFromConfig({
            ...responseConfig,
            params: {
                ...responseConfig.params,
                cost: 1,
            },
        }, {owner: player});
        player.hand.addCard(event);
        const ability = event.abilities[0];
        ability.effect.canRun = async () => true;
        const trigger = createTrigger(event, ability);

        assert.equal(await trigger.canTrigger({effect: {}, player}), false);

        addResource(factory, player, RESOURCE_ENERGY, 'Energy');
        assert.equal(
            await trigger.canTrigger({
                effect: {},
                player,
            }),
            true,
        );
        assert.equal(
            dialogs.some(dialog => dialog.dialogType === DIALOG_PAY_COST),
            false,
        );
    });
});
