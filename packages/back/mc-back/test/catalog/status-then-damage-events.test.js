import assert from 'node:assert/strict';
import {test} from 'node:test';

import {RESOURCE_PHYSICAL} from 'mc-shared';
import justiceEvents from '../../../mc-data/seed/catalog/aspects/justice/events.js';
import protectionEvents from '../../../mc-data/seed/catalog/aspects/protection/events.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

const eventCases = [
    {
        name: 'Arremetida',
        configs: protectionEvents,
        status: 'isStunned',
    },
    {
        name: 'Golpe contundente',
        configs: justiceEvents,
        status: 'isConfused',
    },
];

const createEnemy = (id, status, isStatusApplied) => ({
    abilities: [],
    id,
    isConfused: status === 'isConfused' && isStatusApplied,
    isStunned: status === 'isStunned' && isStatusApplied,
    name: id,
    confuse() {
        this.isConfused = true;
    },
    refresh() {},
    stun() {
        this.isStunned = true;
    },
});

const createScenario = (cardConfig, enemies) => {
    const damageInstances = [];
    const player = {
        canAttack: () => true,
        isHero: true,
        isPlayer: true,
    };
    const match = {
        enemies,
        triggerCards: {},
        activationsFactory: {
            createActivation: () => ({
                applyOverkill: async () => {},
                canRun: async () => true,
                checkStatus: () => true,
                filterTarget: () => true,
                getOverkill: () => false,
                getTriggersEnds: () => [],
                getTriggersInit: () => [],
                getTriggersParams: params => params,
                getTriggersWould: () => [],
            }),
        },
        effectsFactory: {
            createEffect: ({damage, selectedTarget}) => ({
                takenDamage: damage,
                async runEffect() {
                    damageInstances.push({damage, target: selectedTarget});
                },
            }),
        },
    };
    player.match = match;

    const cardsFactory = new CardsFactory({match});
    const card = cardsFactory.createGameCardFromConfig(cardConfig, {owner: player});

    return {
        ability: card.abilities[0],
        card,
        damageInstances,
        player,
    };
};

for (const {name, configs, status} of eventCases) {
    const cardConfig = configs.find(({card}) => card.params.name === name)?.card;
    assert.ok(cardConfig, `Missing ${name} card configuration`);

    test(`${name} applies damage only to the enemy it can affect`, async () => {
        const alreadyAffectedEnemy = createEnemy('already-affected', status, true);
        const selectedEnemy = createEnemy('selected', status, false);
        const {ability, card, damageInstances, player} = createScenario(
            cardConfig,
            [alreadyAffectedEnemy, selectedEnemy]
        );
        const playCardEffect = {resourcesPaid: [RESOURCE_PHYSICAL]};

        const prepared = await ability.prepareToResolve({card, player, playCardEffect});

        assert.equal(prepared.canRun, true);
        assert.equal(ability.effect.selectedTarget, selectedEnemy);

        await ability.resolveAbility({
            card,
            player,
            playCardEffect,
            ...prepared,
        });

        assert.equal(selectedEnemy[status], true);
        assert.equal(alreadyAffectedEnemy[status], true);
        assert.deepEqual(damageInstances, [{damage: 3, target: selectedEnemy}]);
    });

    test(`${name} applies its status without damage when no physical resource was paid`, async () => {
        const selectedEnemy = createEnemy('selected', status, false);
        const {ability, card, damageInstances, player} = createScenario(
            cardConfig,
            [selectedEnemy]
        );
        const playCardEffect = {resourcesPaid: []};
        const prepared = await ability.prepareToResolve({card, player, playCardEffect});

        assert.equal(prepared.canRun, true);

        await ability.resolveAbility({
            card,
            player,
            playCardEffect,
            ...prepared,
        });

        assert.equal(selectedEnemy[status], true);
        assert.deepEqual(damageInstances, []);
    });

    test(`${name} cannot resolve when no enemy can receive its status`, async () => {
        const alreadyAffectedEnemy = createEnemy('already-affected', status, true);
        const {ability, card, damageInstances, player} = createScenario(
            cardConfig,
            [alreadyAffectedEnemy]
        );
        const prepared = await ability.prepareToResolve({
            card,
            player,
            playCardEffect: {resourcesPaid: [RESOURCE_PHYSICAL]},
        });

        assert.equal(prepared.canRun, false);
        assert.deepEqual(damageInstances, []);
    });
}
