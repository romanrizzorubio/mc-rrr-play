import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    PRIORITY_RESPONSE,
    TRIGGER_ENEMY_ATTACKS_YOU,
} from 'mc-shared';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {Engine} from '../../src/engine/engine.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import protectionUpgrades from '../../../mc-data/seed/catalog/aspects/protection/upgrades.js';

test('la segunda copia de Indómito responde cuando el héroe defiende a un esbirro', async () => {
    const cardConfig = protectionUpgrades.find(({_id}) =>
        _id === 'protection-indomito').card;
    const match = {
        triggerCards: {},
    };
    const player = {isPlayer: true};
    const cardsFactory = new CardsFactory({match});
    const copies = [0, 1].map(index =>
        cardsFactory.createGameCardFromConfig(cardConfig, {index, owner: player}));

    for (const card of copies) {
        card.controller = player;
        await card.initTriggers();
        card.abilities[0].effect.canRun = async () => true;
    }

    // La primera copia ya se descartó al resolver la respuesta al ataque del villano.
    copies[0].endTriggers();

    const attack = new EnemyAttackEffect({
        activation: {getTriggersEnds: () => []},
        enemy: {isMinion: true},
        match,
        selectedTarget: player,
    });
    attack.defender = {isHero: true, owner: player};
    const triggerTypes = attack.getTriggersEnds({effect: attack, match, player});
    const engine = new Engine();
    engine.match = match;
    const available = await engine._getTriggers(triggerTypes, PRIORITY_RESPONSE, {
        effect: attack,
        match,
        player,
    });

    assert.ok(triggerTypes.includes(TRIGGER_ENEMY_ATTACKS_YOU));
    assert.deepEqual(available.map(trigger => trigger.card), [copies[1]]);
});
