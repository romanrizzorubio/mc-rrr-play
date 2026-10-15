import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    DIALOG_USE_CARD,
    EFFECT_EXHAUST,
    PRIORITY_INTERRUPT,
    PRIORITY_RESPONSE,
    TARGET_YOUR_HERO,
    TRIGGER_VILLAIN_SCHEMES,
    TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY,
} from 'mc-shared';
import aggressionEvents from '../../../mc-data/seed/catalog/aspects/aggression/events.js';
import basicEvents from '../../../mc-data/seed/catalog/aspects/basic/events.js';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Deck} from '../../src/model/match/deck.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

test('confused hero is offered A por ellos after an attack defeat', async () => {
    const {mainScheme, match, matchFactory, player, superhero} =
        await createConfusedThor('confused-thwart-response');
    superhero.exhausted = true;

    const card = createTriggeredEvent(
        matchFactory,
        player,
        aggressionEvents,
        'aggression-a-por-ellos'
    );
    player.hand.addCard(card);
    await card.initTriggers();

    const dialogs = [];
    match.openDialog = async dialog => {
        dialogs.push(dialog);
        assert.equal(player.isConfused, true);
        assert.equal(dialog.dialogType, DIALOG_USE_CARD);

        return {
            selected: dialog.data.cards.find(({id}) => id === card.id),
        };
    };
    const defeatedEnemy = {isEnemy: true};

    await match.trigger(
        PRIORITY_RESPONSE,
        [TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY],
        {
            effect: {
                activation: {character: superhero},
                checkTrigger: () => true,
                isAttack: true,
                selectedTarget: defeatedEnemy,
            },
            match,
            player,
        }
    );

    assert.equal(dialogs.length, 1);
    assert.deepEqual(dialogs[0].data.cards.map(({name}) => name), ['A por ellos']);
    assert.equal(player.isConfused, false);
    assert.equal(mainScheme.threat, 3);
    assert.equal(player.hand.cards.includes(card), false);
    assert.ok(player.deck.discardPile.includes(card));
});

test('confused hero is offered a thwart interrupt, pays its cost, and cancels its effect', async () => {
    const {match, matchFactory, player} =
        await createConfusedThor('confused-thwart-interrupt');
    const card = createTriggeredEvent(
        matchFactory,
        player,
        basicEvents,
        'basic-emergency',
        {exhaustHero: true}
    );
    player.hand.addCard(card);
    await card.initTriggers();

    const villain = {
        isVillain: true,
        name: 'Villano',
    };
    const triggeringEffect = {
        character: villain,
        checkTrigger: () => true,
        preventThreat: 0,
        selectedTarget: villain,
        threat: 2,
    };
    const dialogs = [];
    match.openDialog = async dialog => {
        dialogs.push(dialog);
        assert.equal(player.isConfused, true);
        assert.equal(dialog.dialogType, DIALOG_USE_CARD);

        return {
            selected: dialog.data.cards.find(({id}) => id === card.id),
        };
    };

    await match.trigger(
        PRIORITY_INTERRUPT,
        [TRIGGER_VILLAIN_SCHEMES],
        {
            effect: triggeringEffect,
            match,
            player,
        }
    );

    assert.equal(dialogs.length, 1);
    assert.deepEqual(dialogs[0].data.cards.map(({name}) => name), ['Emergencia']);
    assert.equal(player.isConfused, false);
    assert.equal(player.exhausted, true);
    assert.equal(triggeringEffect.preventThreat, 0);
    assert.equal(player.hand.cards.includes(card), false);
    assert.ok(player.deck.discardPile.includes(card));
});

async function createConfusedThor(name) {
    const catalog = await loadCatalog();
    const thor = catalog.heroes.find(hero => hero._id === 'thor');
    const match = new Match({
        mc: {
            mcSocket: {
                send() {},
            },
        },
        name,
    });
    const matchFactory = new MatchFactory(match);
    const superhero = matchFactory.createSuperhero(thor.config);
    superhero.selectedSide = 1;
    superhero.confused = 1;
    const mainScheme = createMainScheme();
    match.scenario = {
        mainScheme,
        schemes: [mainScheme],
    };

    const player = match.createPlayer({
        name: 'Thor',
        superhero,
    });
    player.gameZone = new PlayerZone({owner: player});
    player.deck = new Deck({owner: player});
    player.deck.cards = [{}];
    player.hand.refresh = async () => {};
    player.refresh = async () => {};

    return {mainScheme, match, matchFactory, player, superhero};
}

function createMainScheme() {
    return {
        isMainScheme: true,
        threat: 3,
        canRemoveThreat() {
            return this.threat > 0;
        },
        removeThreat(count) {
            this.threat -= count;
        },
        refresh() {},
    };
}

function createTriggeredEvent(
    matchFactory,
    player,
    events,
    id,
    {exhaustHero = false} = {}
) {
    const entry = events.find(event => event._id === id);
    assert.ok(entry, `Missing event: ${id}`);
    const cardConfig = {
        ...entry.card,
        params: {
            ...entry.card.params,
            abilities: entry.card.params.abilities.map(ability => ({
                ...ability,
                params: {
                    ...ability.params,
                    ...(exhaustHero ? {
                        arrow: {
                            type: EFFECT_EXHAUST,
                            params: {target: TARGET_YOUR_HERO},
                        },
                    } : {}),
                },
            })),
        },
    };

    return matchFactory.cardsFactory.createGameCardFromConfig(
        cardConfig,
        {owner: player}
    );
}
