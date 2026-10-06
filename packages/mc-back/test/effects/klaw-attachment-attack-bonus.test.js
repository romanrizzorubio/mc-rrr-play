import assert from 'node:assert/strict';
import {test} from 'node:test';

import {Attack} from '../../src/activations/attack.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';

test('Klaw gets the Sonic Amplifier attack bonus without an interrupt dialog', async () => {
    const {scenarios} = await loadCatalog();
    const klaw = scenarios.find(({_id}) => _id === 'klaw');
    const player = {
        hand: {cards: []},
        isPlayer: true,
    };
    const dialogs = [];
    const match = {
        activationsFactory: {
            createActivation: ({effect}) => new Attack({effect}),
        },
        numPlayers: 1,
        triggerCards: {},
        async openDialog(dialog) {
            dialogs.push(dialog);

            return {};
        },
    };
    const cardsFactory = new CardsFactory({match});
    const villain = cardsFactory.createGameCard({
        card: cardsFactory.createCard(klaw.config.villains[0]),
        owner: player,
    });
    const sonicAmplifierConfig = klaw.config.cards.find(({card}) =>
        card.params.name === 'Transformador sónico').card;
    const sonicAmplifier = cardsFactory.createGameCard({
        card: cardsFactory.createCard(sonicAmplifierConfig),
        owner: player,
    });

    villain.attached.push(sonicAmplifier);
    sonicAmplifier.attachedTo = villain;
    await sonicAmplifier.initTriggers();

    const attack = new EnemyAttackEffect({
        enemy: villain,
        match,
        selectedTarget: player,
    });
    await attack.triggerInit(attack.getTriggersParams({player}));

    assert.equal(await villain.getAttackValue({player}), 1);
    assert.deepEqual(dialogs, []);
});
