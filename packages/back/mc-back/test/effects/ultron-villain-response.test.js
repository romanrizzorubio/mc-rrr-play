import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    EFFECT_PUT_FACEDOWN_CARD_IN_PLAY,
    PRIORITY_FORCED_RESPONSE,
    TRIGGER_VILLAIN_ATTACKS_YOU,
} from 'mc-shared';
import {Engine} from '../../src/engine/engine.js';
import {OptionAbility} from '../../src/abilities/misc/option-ability.js';
import {
    addPlayerEvent,
    createUltronTestContext,
} from '../../test-support/ultron-test-context.js';

test('Ultron I attack response options resolve as abilities', async () => {
    const context = await createUltronTestContext();
    const [player] = context.players;
    const sourceCard = addPlayerEvent(
        context.cardsFactory,
        player,
        'ultron-response-source'
    );
    const villain = context.cardsFactory.createGameCard({
        card: context.cardsFactory.createCard(context.ultron.config.villains[0]),
        owner: context.scenario,
    });

    context.match.villain = villain;
    await villain.initTriggers();

    const forcedResponse = villain.triggers[TRIGGER_VILLAIN_ATTACKS_YOU][
        PRIORITY_FORCED_RESPONSE
    ][0];
    const engine = new Engine();
    engine.match = context.match;
    const params = {
        card: villain,
        effect: {},
        match: context.match,
        player,
    };
    const {cardsTriggers} = await engine._getCardTriggers([forcedResponse], params);
    const optionTriggers = cardsTriggers[villain.id].triggers
        .flatMap(({triggers}) => triggers);
    const droneOption = optionTriggers.find(trigger =>
        trigger.ability.effect.effectType === EFFECT_PUT_FACEDOWN_CARD_IN_PLAY);

    assert.ok(optionTriggers.length > 0);
    assert.ok(optionTriggers.every(trigger => trigger.ability instanceof OptionAbility));
    assert.ok(droneOption);

    await droneOption.runTrigger(params);

    assert.strictEqual(player.gameZone.minions[0], sourceCard);
});
