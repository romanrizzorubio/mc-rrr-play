import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_RESOURCE,
    PRIORITY_RESPONSE,
    RESOURCE_PHYSICAL,
    TRIGGER_THIS_ATTACK,
} from 'mc-shared';
import leadershipAllies from '../../../mc-data/seed/catalog/aspects/leadership/allies.js';
import {Attack} from '../../src/activations/attack.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

describe('Adam Warlock', () => {
    test('removes exactly 3 threat after discarding a physical resource', async () => {
        const scheme = {
            threat: 10,
            canRemoveThreat() {
                return this.threat > 0;
            },
            removeThreat(threat) {
                this.threat = Math.max(0, this.threat - threat);
            },
            refresh() {},
        };
        const match = {
            numPlayers: 2,
            players: [],
            schemes: [scheme],
            triggerCards: {},
        };
        const discardedCards = [];
        const hand = {
            cards: [],
            async discardRandom() {
                return this.cards[0];
            },
            async discardHand(card) {
                this.cards = this.cards.filter(handCard => handCard !== card);
            },
            async refresh() {},
        };
        const player = {
            id: 'player',
            isPlayer: true,
            hand,
            deck: {
                async discard(card) {
                    discardedCards.push(card);
                },
                refresh() {},
            },
        };
        match.players.push(player);

        const cardsFactory = new CardsFactory({match});
        const adamWarlockConfig = leadershipAllies.find(({_id}) =>
            _id === 'leadership-adam-warlock');
        const adamWarlock = cardsFactory.createGameCardFromConfig(
            adamWarlockConfig.card,
            {owner: player}
        );
        adamWarlock.controller = player;
        const physicalResource = cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name: 'Physical resource',
                resources: [RESOURCE_PHYSICAL],
            },
        }, {owner: player});
        hand.cards.push(physicalResource);
        await adamWarlock.initTriggers();

        const attack = new Attack({
            effect: {
                ability: {isBasic: false},
                character: adamWarlock,
                isAttack: true,
                match,
                selectedTarget: {isEnemy: true, name: 'Test enemy'},
            },
        });
        const triggerParams = attack.getTriggersParams({
            effect: attack.effect,
            match,
            player,
        });
        const [trigger] = await attack._getTriggers(
            attack.getTriggersEnds(triggerParams),
            PRIORITY_RESPONSE,
            triggerParams
        );

        assert.ok(trigger);
        assert.equal(trigger.trigger, TRIGGER_THIS_ATTACK);
        await trigger.runTrigger(triggerParams);

        assert.deepEqual(discardedCards, [physicalResource]);
        assert.equal(scheme.threat, 7);
    });
});
