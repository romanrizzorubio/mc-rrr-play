import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    DIALOG_PAY_COST,
    DIALOG_USE_CARD,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
} from 'mc-shared';
import aggressionEvents from '../../../mc-data/seed/catalog/aspects/aggression/events.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {Hand} from '../../src/model/match/hand.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';

test('overkill resolves defeat responses sequentially despite a stale A por ellos target', async () => {
    const match = new Match({
        mc: {
            mcSocket: {
                send() {},
            },
        },
        name: 'overkill-response',
    });
    const matchFactory = new MatchFactory(match);
    const dialogs = [];
    const dialogWaiters = new Map();
    let activeDialogs = 0;
    let maxActiveDialogs = 0;
    const player = {
        match,
        isHero: true,
        isPlayer: true,
        canAttack: () => true,
        canThwart: () => true,
        minions: [],
        superhero: {currentSide: {}},
        deck: {
            async discard() {},
        },
        async getCardsToPay() {
            return {hand: [], generators: []};
        },
    };
    player.hand = new Hand(player);
    player.hand.refresh = async () => {};
    match.players.push(player);

    const mainScheme = {
        threat: 3,
        canRemoveThreat() {
            return this.threat > 0;
        },
        removeThreat(threat) {
            this.threat = Math.max(0, this.threat - threat);
        },
        refresh() {},
    };
    const villain = createEnemy('Villain', 3, true);
    match.scenario = {
        schemes: [mainScheme],
        villain,
    };

    match.openDialog = async dialog => {
        if (dialog.dialogType === DIALOG_PAY_COST) {
            return {
                paid: {hand: [], generators: []},
                resources: [RESOURCE_MENTAL, RESOURCE_PHYSICAL],
            };
        }

        assert.equal(dialog.dialogType, DIALOG_USE_CARD);
        activeDialogs++;
        maxActiveDialogs = Math.max(maxActiveDialogs, activeDialogs);

        return new Promise(resolve => {
            dialogs.push({dialog, resolve});
            for (const [count, waiter] of dialogWaiters) {
                if (dialogs.length >= count) {
                    dialogWaiters.delete(count);
                    waiter();
                }
            }
        }).finally(() => {
            activeDialogs--;
        });
    };

    const aPorEllos = createCard(
        matchFactory,
        player,
        'aggression-a-por-ellos'
    );
    const aPorEllosEffect = aPorEllos.abilities[0].effect;
    assert.equal(aPorEllosEffect.refreshTarget, true);
    aPorEllosEffect.selectedTarget = {
        name: 'Fábrica de armamento ilegal',
        canRemoveThreat: () => false,
    };
    assert.deepEqual(aPorEllosEffect.getValidTarget({player}), [mainScheme]);

    const assault = createCard(
        matchFactory,
        player,
        'aggression-asalto-implacable'
    );
    player.hand.addCards([aPorEllos, assault]);

    const minion = createEnemy('Minion', 2, false);
    minion.canBeAttacked = () => true;
    player.minions.push(minion);

    const waitForDialogCount = count => {
        if (dialogs.length >= count) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            dialogWaiters.set(count, resolve);
        });
    };

    const play = new PlayCardEffect({
        card: assault,
        ability: assault.abilities[0],
        match,
    });
    const playPromise = play.runEffect({player});

    await waitForDialogCount(1);
    assert.deepEqual(
        dialogs[0].dialog.data.cards.map(card => card.name),
        ['A por ellos']
    );
    dialogs[0].resolve({});

    await waitForDialogCount(2);
    assert.deepEqual(
        dialogs[1].dialog.data.cards.map(card => card.name),
        ['A por ellos']
    );
    dialogs[1].resolve({});

    await playPromise;

    assert.equal(maxActiveDialogs, 1);
    assert.equal(minion.damage, 5);
    assert.equal(villain.damage, 3);
});

function createCard(matchFactory, owner, id) {
    const entry = aggressionEvents.find(card => card._id === id);
    assert.ok(entry, `Missing aggression event: ${id}`);

    return matchFactory.cardsFactory.createGameCard({
        card: matchFactory.cardsFactory.createCard(entry.card),
        owner,
    });
}

function createEnemy(name, hitPoints, isVillain) {
    return {
        name,
        isEnemy: true,
        isInPlay: true,
        isMinion: !isVillain,
        isVillain,
        hitPoints,
        damage: 0,
        async getLife() {
            return this.hitPoints - this.damage;
        },
        placeDamage(damage) {
            this.damage += damage;
        },
        refresh() {},
        async defeat() {
            this.isInPlay = false;
        },
    };
}
