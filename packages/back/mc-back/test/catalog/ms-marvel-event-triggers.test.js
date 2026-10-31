import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ACTION,
    CARD_TYPE_MINION,
    CARD_TYPE_RESOURCE,
    DIALOG_PAY_COST,
    DIALOG_USE_CARD,
    RESOURCE_MENTAL,
    TRIGGER_YOU_END_PLAY_CARD,
} from 'mc-shared';
import msMarvel from '../../../mc-data/seed/catalog/heroes/ms-marvel.js';
import justiceEvents from '../../../mc-data/seed/catalog/aspects/justice/events.js';
import aggressionEvents from '../../../mc-data/seed/catalog/aspects/aggression/events.js';
import rhino from '../../../mc-data/seed/catalog/scenarios/rhino.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

describe('Ms. Marvel event triggers', () => {
    async function createFixture({
        eventName = 'Escabullirse',
        useShrink = true,
        useMorphogenetics = true,
        shrinkExhausted = false,
        heroExhausted = false,
        includeGrow = false,
        useGrow = true,
        growExhausted = false,
    } = {}) {
        const match = new Match({
            name: 'ms-marvel-event-triggers',
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

        async function putUpgrade(name, exhausted) {
            const upgrade = player.deck.cards.find(card => card.name === name);
            assert.ok(upgrade, `Missing upgrade ${name}`);
            player.deck.removeCardFromDeck(upgrade);
            await new PutPlayEffect({
                match,
                card: upgrade,
                controller: player,
            }).runEffect({player, force: true});
            upgrade.exhausted = exhausted;
            assert.equal(upgrade.isInPlay, true);
            assert.equal(match.triggerCards[upgrade.id], upgrade);
            return upgrade;
        }
        const shrink = await putUpgrade('Encoger', shrinkExhausted);
        const grow = includeGrow ? await putUpgrade('¡Agrandar!', growExhausted) : undefined;
        player.superhero.exhausted = heroExhausted;
        assert.equal(player.isHero, true);
        assert.equal(match.triggerCards[player.superhero.currentSide.id],
            player.superhero.currentSide);

        let event = player.deck.cards.find(card => card.name === eventName);
        if (event) {
            player.deck.removeCardFromDeck(event);
        } else {
            const definition = [...justiceEvents, ...aggressionEvents].find(entry =>
                entry.card.params.name === eventName);
            assert.ok(definition, `Missing event ${eventName}`);
            event = factory.cardsFactory.createGameCardFromConfig(
                structuredClone(definition.card), {owner: player});
        }
        player.hand.addCard(event);
        const resources = Array.from({length: event.card.cost}, () => RESOURCE_MENTAL);
        const resource = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name: 'Recursos para el evento',
                resources,
            },
        }, {owner: player});
        player.hand.addCard(resource);
        const scheme = scenario.mainScheme;
        scheme.threat = 6;
        const offers = [];
        const order = [];
        let dialogs = 0;
        match.openDialog = async dialog => {
            assert.ok(++dialogs < 20, `Repeated dialog ${dialog.dialogType}`);
            if (dialog.dialogType === DIALOG_PAY_COST) {
                order.push('payment');
                return {
                    paid: {hand: [{id: resource.id}], generators: []},
                    resources,
                };
            }
            if (dialog.dialogType === DIALOG_USE_CARD) {
                const offeredCards = dialog.data.cards;
                offers.push(...offeredCards.map(card => card.name));
                const shrinkOption = offeredCards.find(card => card.name === 'Encoger');
                if (shrinkOption) {
                    order.push('shrink');
                    assert.equal(scheme.threat, 6);
                    assert.ok(!player.deck.discardPile.includes(event));
                    return useShrink ? {selected: {id: shrinkOption.id}} : {};
                }
                const growOption = offeredCards.find(card => card.name === '¡Agrandar!');
                if (growOption) {
                    order.push('grow');
                    assert.equal(scenario.villain.damage, 0);
                    assert.ok(!player.deck.discardPile.includes(event));
                    return useGrow ? {selected: {id: growOption.id}} : {};
                }
                const heroOption = offeredCards.find(card => card.name === 'Ms. Marvel');
                if (heroOption) {
                    order.push('morphogenetics');
                    assert.ok(player.deck.discardPile.includes(event));
                    return useMorphogenetics ? {selected: {id: heroOption.id}} : {};
                }
                assert.fail(`Unexpected optional trigger: ${offeredCards.map(card => card.name)}`);
            }
            return {
                selected: dialog.data?.cards?.[0] ?? dialog.data?.options?.[0],
            };
        };
        const play = new PlayCardEffect({match, card: event});
        return {match, factory, player, scenario, shrink, grow, event, resource, scheme, offers, order, play};
    }

    for (const eventName of ['Escabullirse', 'Por la justicia']) {
        test(`${eventName} offers Encoger before removing threat and Morfogenética after resolution`, async () => {
            const fixture = await createFixture({eventName});
            const {player, shrink, event, scheme, offers, order, play} = fixture;
            await play.runEffect({player});

            assert.equal(play.played, true);
            assert.deepEqual(offers, ['Encoger', 'Ms. Marvel']);
            assert.deepEqual(order, ['payment', 'shrink', 'morphogenetics']);
            assert.equal(scheme.threat, eventName === 'Escabullirse' ? 1 : 0);
            assert.equal(shrink.exhausted, true);
            assert.equal(player.superhero.exhausted, true);
            assert.ok(player.hand.cards.includes(event));
            assert.ok(!player.deck.discardPile.includes(event));
        });
    }

    test('declining both abilities leaves the event discarded and removes only its printed threat', async () => {
        const {player, shrink, event, scheme, offers, play} = await createFixture({
            useShrink: false,
            useMorphogenetics: false,
        });
        await play.runEffect({player});

        assert.deepEqual(offers, ['Encoger', 'Ms. Marvel']);
        assert.equal(scheme.threat, 3);
        assert.equal(shrink.exhausted, false);
        assert.equal(player.superhero.exhausted, false);
        assert.ok(player.deck.discardPile.includes(event));
        assert.ok(!player.hand.cards.includes(event));
    });

    test('an exhausted Encoger is not offered but a ready hero can recover the event', async () => {
        const {player, event, scheme, offers, play} = await createFixture({
            shrinkExhausted: true,
        });
        await play.runEffect({player});

        assert.deepEqual(offers, ['Ms. Marvel']);
        assert.equal(scheme.threat, 3);
        assert.equal(player.superhero.exhausted, true);
        assert.ok(player.hand.cards.includes(event));
    });

    test('an exhausted hero cannot recover the event but a ready Encoger can increase its thwart', async () => {
        const {player, shrink, event, scheme, offers, play} = await createFixture({
            heroExhausted: true,
        });
        await play.runEffect({player});

        assert.deepEqual(offers, ['Encoger']);
        assert.equal(scheme.threat, 1);
        assert.equal(shrink.exhausted, true);
        assert.ok(player.deck.discardPile.includes(event));
    });

    test('an attack event can be recovered without offering Encoger', async () => {
        const {player, scenario, event, offers, play} = await createFixture({
            eventName: 'Manos grandes',
        });
        await play.runEffect({player});

        assert.deepEqual(offers, ['Ms. Marvel']);
        assert.equal(scenario.villain.damage, 4);
        assert.ok(player.hand.cards.includes(event));
    });

    test('both exhausted sources correctly leave the event unmodified and discarded', async () => {
        const {player, shrink, event, scheme, offers, play} = await createFixture({
            shrinkExhausted: true,
            heroExhausted: true,
        });
        await play.runEffect({player});

        assert.deepEqual(offers, []);
        assert.equal(scheme.threat, 3);
        assert.equal(shrink.exhausted, true);
        assert.equal(player.superhero.exhausted, true);
        assert.ok(player.deck.discardPile.includes(event));
    });

    test('Manos grandes offers Agrandar before dealing six damage and Morfogenética afterwards', async () => {
        const {player, scenario, grow, event, offers, order, play} = await createFixture({
            eventName: 'Manos grandes',
            includeGrow: true,
        });
        await play.runEffect({player});

        assert.equal(play.played, true);
        assert.deepEqual(offers, ['¡Agrandar!', 'Ms. Marvel']);
        assert.deepEqual(order, ['payment', 'grow', 'morphogenetics']);
        assert.equal(scenario.villain.damage, 6);
        assert.equal(grow.exhausted, true);
        assert.equal(player.superhero.exhausted, true);
        assert.ok(player.hand.cards.includes(event));
        assert.ok(!player.deck.discardPile.includes(event));
    });

    test('a ready Agrandar increases attack damage even when the hero is exhausted', async () => {
        const {player, scenario, grow, event, offers, play} = await createFixture({
            eventName: 'Manos grandes',
            includeGrow: true,
            heroExhausted: true,
        });
        await play.runEffect({player});

        assert.deepEqual(offers, ['¡Agrandar!']);
        assert.equal(scenario.villain.damage, 6);
        assert.equal(grow.exhausted, true);
        assert.ok(player.deck.discardPile.includes(event));
    });

    test('Agrandar increases both Cuerpo a cuerpo damage instances from three to five', async () => {
        const {match, factory, player, scenario, grow, event, offers, play} = await createFixture({
            eventName: 'Cuerpo a cuerpo',
            includeGrow: true,
            heroExhausted: true,
        });
        const minion = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {
                name: 'Esbirro para Cuerpo a cuerpo',
                hitPoints: 10,
                attack: 0,
                scheme: 0,
                boost: 0,
            },
        }, {owner: scenario});
        await new RevealEncounterEffect({
            match,
            selectedTarget: minion,
        }).runEffect({player});
        const villain = scenario.villain;
        assert.equal(villain.damage, 0);
        assert.equal(minion.damage, 0);
        assert.equal(minion.isInPlay, true);
        assert.ok(match.getEnemiesFor(player).includes(villain));
        assert.ok(match.getEnemiesFor(player).includes(minion));

        await play.runEffect({player});

        assert.equal(play.played, true);
        assert.deepEqual([villain.damage, minion.damage], [5, 5]);
        const damageEffects = event.abilities[0].effect.effects;
        assert.equal(damageEffects.length, 2);
        assert.notEqual(damageEffects[0].selectedTarget, damageEffects[1].selectedTarget);
        assert.deepEqual(damageEffects.map(effect => effect.damageModifier), [2, 2]);
        assert.deepEqual(offers, ['¡Agrandar!']);
        assert.equal(grow.exhausted, true);
        assert.ok(player.deck.discardPile.includes(event));
    });

    for (const useGrow of [false, true]) {
        test(`Cuerpo a cuerpo stays playable with one enemy and ${useGrow ? 'increased' : 'printed'} damage`, async () => {
            const {player, scenario, grow, event, offers, play} = await createFixture({
                eventName: 'Cuerpo a cuerpo',
                includeGrow: true,
                useGrow,
                heroExhausted: true,
            });
            const villain = scenario.villain;
            for (let refresh = 0; refresh < 3; refresh++) {
                const hand = await player.hand.toObjWithPlayability();
                const displayedEvent = hand.find(card => card.id === event.id);
                assert.equal(displayedEvent.playable, true);
                assert.deepEqual(displayedEvent.playableTargetIds, [villain.id]);
            }
            assert.equal(await event.canPlay({player, abilityType: ABILITY_ACTION}), true);
            await play.runEffect({player});

            assert.equal(play.played, true);
            assert.equal(villain.damage, useGrow ? 5 : 3);
            const [firstDamage, secondDamage] = event.abilities[0].effect.effects;
            assert.equal(firstDamage.selectedTarget, villain);
            assert.equal(firstDamage.resolved, true);
            assert.equal(secondDamage.resolved, false);
            assert.deepEqual(offers, ['¡Agrandar!']);
            assert.equal(grow.exhausted, useGrow);
            assert.ok(player.deck.discardPile.includes(event));
        });
    }

    test('Cuerpo a cuerpo remains playable after recovering it with only one enemy', async () => {
        const {match, player, scenario, event, resource, play} = await createFixture({
            eventName: 'Cuerpo a cuerpo',
        });
        await play.runEffect({player});
        assert.equal(scenario.villain.damage, 3);
        assert.ok(player.hand.cards.includes(event));
        assert.equal(await event.canPlay({player, abilityType: ABILITY_ACTION}), true);
        const displayedEvent = (await player.hand.toObjWithPlayability())
            .find(card => card.id === event.id);
        assert.equal(displayedEvent.playable, true);
        assert.deepEqual(displayedEvent.playableTargetIds, [scenario.villain.id]);

        assert.ok(player.deck.discardPile.includes(resource));
        player.deck.searchDiscard(resource);
        player.hand.addCard(resource);
        const replay = new PlayCardEffect({match, card: event});
        await replay.runEffect({player});
        assert.equal(replay.played, true);
        assert.equal(scenario.villain.damage, 6);
        assert.ok(player.deck.discardPile.includes(event));
        assert.ok(player.deck.discardPile.includes(resource));
    });

    test('Cuerpo a cuerpo is not playable without a legal enemy', async () => {
        const {player, scenario, event, resource, offers, play} = await createFixture({
            eventName: 'Cuerpo a cuerpo',
            heroExhausted: true,
        });
        scenario.villain.canBeAttacked = () => false;
        assert.equal(await event.canPlay({player, abilityType: ABILITY_ACTION}), false);
        const displayedEvent = (await player.hand.toObjWithPlayability())
            .find(card => card.id === event.id);
        assert.equal(displayedEvent.playable, false);
        assert.deepEqual(displayedEvent.playableTargetIds, []);
        await play.runEffect({player});
        assert.equal(play.played, false);
        assert.equal(scenario.villain.damage, 0);
        assert.deepEqual(offers, []);
        assert.ok(player.hand.cards.includes(event));
        assert.ok(player.hand.cards.includes(resource));
    });

    test('declining Agrandar keeps it ready and deals only the printed attack damage', async () => {
        const {player, scenario, grow, offers, play} = await createFixture({
            eventName: 'Manos grandes',
            includeGrow: true,
            useGrow: false,
            heroExhausted: true,
        });
        await play.runEffect({player});

        assert.deepEqual(offers, ['¡Agrandar!']);
        assert.equal(scenario.villain.damage, 4);
        assert.equal(grow.exhausted, false);
    });

    test('an exhausted Agrandar is not offered and cannot increase attack damage', async () => {
        const {player, scenario, grow, offers, play} = await createFixture({
            eventName: 'Manos grandes',
            includeGrow: true,
            growExhausted: true,
            heroExhausted: true,
        });
        await play.runEffect({player});

        assert.deepEqual(offers, []);
        assert.equal(scenario.villain.damage, 4);
        assert.equal(grow.exhausted, true);
    });

    test('Agrandar is not offered for a thwart event and stays ready', async () => {
        const {player, grow, scheme, offers, play} = await createFixture({
            includeGrow: true,
            shrinkExhausted: true,
            heroExhausted: true,
        });
        await play.runEffect({player});

        assert.deepEqual(offers, []);
        assert.equal(scheme.threat, 3);
        assert.equal(grow.exhausted, false);
    });

    test('Agrandar and Encoger are not offered for events played by another player', async () => {
        const {factory, match, grow, shrink, offers} = await createFixture({
            eventName: 'Manos grandes',
            includeGrow: true,
            useGrow: false,
            useShrink: false,
        });
        const otherSuperheroConfig = structuredClone(msMarvel.config);
        otherSuperheroConfig.sides.forEach(side => {
            side.params.abilities = [];
        });
        const otherPlayer = match.createPlayer({
            name: 'Otro jugador',
            superhero: factory.createSuperhero({
                ...otherSuperheroConfig,
                precon: [],
                obligation: undefined,
                nemesis: [],
            }),
        });
        otherPlayer.initPlayer();
        otherPlayer.superhero.selectedSide = 1;

        for (const eventName of ['Manos grandes', 'Escabullirse']) {
            const event = otherPlayer.deck.cards.find(card =>
                card.name === eventName);
            assert.ok(event, `Missing event ${eventName}`);
            otherPlayer.deck.removeCardFromDeck(event);
            otherPlayer.hand.addCard(event);

            const play = new PlayCardEffect({card: event, match});
            await play.triggerPlayCardInterrupts(
                play.getTriggersParams({player: otherPlayer})
            );
        }

        assert.deepEqual(offers, []);
        assert.equal(grow.exhausted, false);
        assert.equal(shrink.exhausted, false);
    });

    test('Agrandar can resolve its target only when the play context includes triggeredCard', async () => {
        const {player, grow, event, play} = await createFixture({
            eventName: 'Manos grandes',
            includeGrow: true,
        });
        const params = play.getTriggersParams({player});
        assert.equal(params.card, event);
        assert.equal(params.effect.card, event);
        assert.equal(params.triggeredCard, undefined);
        assert.ok(!await grow.abilities[0].effect.canRun(params));
        assert.equal(await grow.abilities[0].effect.canRun({
            ...params,
            triggeredCard: event,
        }), true);
    });

    test('Encoger can resolve its target only when the play context includes triggeredCard', async () => {
        const {player, shrink, event, play} = await createFixture();
        const params = play.getTriggersParams({player});
        assert.equal(params.card, event);
        assert.equal(params.effect.card, event);
        assert.equal(params.triggeredCard, undefined);
        assert.ok(!await shrink.abilities[0].effect.canRun(params));
        assert.equal(await shrink.abilities[0].effect.canRun({
            ...params,
            triggeredCard: event,
        }), true);
    });

    test('Morfogenética can resolve its target only when the end-play context includes triggeredCard', async () => {
        const {player, event, play} = await createFixture({
            useShrink: false,
            useMorphogenetics: false,
        });
        await play.runEffect({player});
        assert.ok(player.deck.discardPile.includes(event));
        assert.equal(player.superhero.exhausted, false);
        const params = play.getTriggersParams({player});
        const morphogenetics = player.superhero.currentSide.abilities.find(ability =>
            ability.name === 'Morfogenética');
        assert.ok(morphogenetics);
        assert.equal(params.triggeredCard, undefined);
        assert.ok(!await morphogenetics.effect.canRun(params));
        assert.equal(await morphogenetics.effect.canRun({
            ...params,
            triggeredCard: event,
        }), true);
        assert.equal(morphogenetics.trigger, TRIGGER_YOU_END_PLAY_CARD);
    });

    test('Morfogenética is not offered for an event played by another player', async () => {
        const {factory, match, player, event, offers, play} = await createFixture({
            useMorphogenetics: false,
        });
        await play.runEffect({player});

        const otherSuperheroConfig = structuredClone(msMarvel.config);
        otherSuperheroConfig.sides.forEach(side => {
            side.params.abilities = [];
        });
        const otherPlayer = match.createPlayer({
            name: 'Otro jugador',
            superhero: factory.createSuperhero({
                ...otherSuperheroConfig,
                precon: [],
                obligation: undefined,
                nemesis: [],
            }),
        });
        otherPlayer.initPlayer();
        const otherEvent = otherPlayer.deck.cards.find(card =>
            card.name === event.name);
        assert.ok(otherEvent);
        otherPlayer.deck.removeCardFromDeck(otherEvent);
        otherPlayer.deck.discardPile.push(otherEvent);

        const otherPlay = new PlayCardEffect({card: otherEvent, match});
        otherPlay.resolved = true;
        await otherPlay.triggerEnds(
            otherPlay.getTriggersParams({player: otherPlayer})
        );

        assert.deepEqual(offers, ['Encoger', 'Ms. Marvel']);
        assert.equal(player.superhero.exhausted, false);
        assert.ok(otherPlayer.deck.discardPile.includes(otherEvent));
        assert.ok(!otherPlayer.hand.cards.includes(otherEvent));
    });
});
