import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    PRIORITY_INTERRUPT,
    TRIGGER_BOOST_REVEALED,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {EnemySchemeEffect} from '../../src/effects/enemy-scheme-effect.js';
import {ResolveBoostEffect} from '../../src/effects/resolve-boost-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

describe('¡No tan deprisa!', () => {
    test('can cancel boost icons only during villain scheme activations', async () => {
        const catalog = await loadCatalog();
        const definition = catalog.aspects.find(({_id}) =>
            _id === 'justice-no-tan-deprisa');
        assert.ok(definition);

        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'no-tan-deprisa-scheme-test',
        });
        const matchFactory = new MatchFactory(match);
        const player = {
            hand: {cards: []},
            isHero: true,
            isPlayer: true,
            match,
            canPlayCard: async () => true,
        };
        match.players.push(player);

        const event = matchFactory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player}
        );
        player.hand.cards.push(event);
        event.canPlay = async () => true;
        const [ability] = event.abilities;
        ability.costs.canPay = async () => true;
        await event.initTriggers({player});

        const trigger = event.triggers[TRIGGER_BOOST_REVEALED][
            PRIORITY_INTERRUPT
        ][0];
        assert.ok(trigger);

        for (const {activation, expected} of [
            {
                activation: new EnemyAttackEffect({match}),
                expected: false,
            },
            {
                activation: new EnemySchemeEffect({match}),
                expected: true,
            },
        ]) {
            const boostCard = {boost: 1};
            const boostEffect = new ResolveBoostEffect({
                activation: activation.activation,
                card: boostCard,
                enemyActivation: activation,
                match,
            });
            boostEffect.boostValue = 1;

            const triggerParams = boostEffect.getTriggersParams({
                match,
                player,
            });

            assert.equal(
                await trigger.canTrigger(triggerParams),
                expected
            );
        }
    });
});
