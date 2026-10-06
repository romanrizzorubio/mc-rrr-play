import assert from 'node:assert/strict';
import {test} from 'node:test';

import {DIALOG_BOOST_DEALT, DIALOG_USE_CARD} from 'mc-shared';
import {Attack} from '../../src/activations/attack.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';

test('Klaw adds both boost cards to the attack damage total', async () => {
    const {scenarios} = await loadCatalog();
    const klaw = scenarios.find(({_id}) => _id === 'klaw');
    const player = {
        defenders: [],
        hand: {cards: []},
        isPlayer: true,
        superhero: {currentSide: {}},
    };
    const boostCards = [
        createBoostCard('Primer aumento', 2),
        createBoostCard('Segundo aumento', 3),
    ];
    const boostDialogs = [];
    let drawCount = 0;
    let attackDamage;
    const match = {
        skipBoostDealtNotification: true,
        triggerCards: {},
        async drawEncounterCards() {
            return [boostCards[drawCount++]];
        },
        async openDialog(dialog) {
            if (dialog.dialogType === DIALOG_USE_CARD) {
                return {selected: {id: villain.id}};
            }
            if (dialog.dialogType === DIALOG_BOOST_DEALT) {
                boostDialogs.push(dialog);
            }
            return {};
        },
        effectsFactory: {
            createEffect({damage}) {
                return {
                    takenDamage: damage,
                    async runEffect() {
                        attackDamage = damage;
                    },
                };
            },
        },
        activationsFactory: {
            createActivation: ({effect}) => new Attack({effect}),
        },
    };
    const cardsFactory = new CardsFactory({match});
    const villain = cardsFactory.createGameCard({
        card: cardsFactory.createCard(klaw.config.villains[0]),
        owner: player,
    });
    villain.getAttackValue = async () => 0;
    await villain.initTriggers();

    const attack = new EnemyAttackEffect({
        enemy: villain,
        match,
        selectedTarget: player,
    });
    const params = {player};

    await attack.triggerInit(attack.getTriggersParams(params));
    await attack.execute(params);

    assert.equal(drawCount, 2);
    assert.equal(attackDamage, 5);
    assert.deepEqual(
        boostDialogs.map(({data}) => data.cards.map(card => card?.card.boost ?? null)),
        [[2, null], [2, 3]]
    );
    assert.deepEqual(
        boostDialogs.map(({data}) => data.cumulativeBoost),
        [2, 5]
    );
});

function createBoostCard(name, boost) {
    return {
        boost,
        isInPlay: false,
        async discard() {},
        toObj() {
            return {
                boost,
                image: `${name}.png`,
                name,
            };
        },
    };
}
