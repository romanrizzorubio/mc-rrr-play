import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    DIALOG_USE_CARD,
    PRIORITY_INTERRUPT,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
} from 'mc-shared';
import {Engine} from '../../src/engine/engine.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {Trigger} from '../../src/triggers/base/trigger.js';

function createDamageInterruptTrigger(card, id, name) {
    return new Trigger({
        ability: {
            effect: {
                isChoose: false,
                isChooseAbility: false,
            },
            hideDialog: false,
            id,
            isEndLasting: false,
            name,
            async canTrigger() {
                return true;
            },
            getTitle() {
                return this.name;
            },
        },
        card,
        trigger: TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    });
}

test('damage interrupt dialog shows damage if no further interrupt is selected', async () => {
    const player = {
        hand: {
            cards: [],
        },
    };
    const card = {
        id: 'damage-interrupt',
        owner: player,
        toObj: () => ({id: 'damage-interrupt'}),
        triggers: {},
    };
    const trigger = createDamageInterruptTrigger(
        card,
        'damage-interrupt--prevent-damage',
        'Evitar daño'
    );
    card.triggers[TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE] = {
        [PRIORITY_INTERRUPT]: [trigger],
    };

    const effect = new TakeDamageEffect({damage: 5});
    const engine = new Engine();
    const dialogs = [];

    engine.match = {
        triggerCards: {
            [card.id]: card,
        },
    };
    engine.openDialog = async dialog => {
        dialogs.push(dialog);
        return {};
    };

    await engine.trigger(
        PRIORITY_INTERRUPT,
        [TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE],
        {effect, player}
    );

    assert.equal(dialogs.length, 1);
    assert.equal(dialogs[0].dialogType, DIALOG_USE_CARD);
    assert.equal(
        dialogs[0].subtitle,
        'Si no eliges ninguna Interrupción más, sufrirás 5 de Daño en total.'
    );
});

test('nested interrupt choice dialog also shows pending damage', async () => {
    const player = {
        hand: {
            cards: [],
        },
    };
    const effect = new TakeDamageEffect({damage: 5});
    const dialogs = [];
    const engine = new Engine();
    const card = {
        card: {
            toObj: () => ({id: 'damage-interrupt'}),
        },
        triggers: [
            createDamageInterruptTrigger(
                {id: 'damage-interrupt'},
                'damage-interrupt--first',
                'Primera opción'
            ),
            createDamageInterruptTrigger(
                {id: 'damage-interrupt'},
                'damage-interrupt--second',
                'Segunda opción'
            ),
        ],
    };

    engine.openDialog = async dialog => {
        dialogs.push(dialog);
        return {
            selected: {id: '0'},
        };
    };

    await engine._openTriggersDialogTriggers(
        card,
        false,
        {effect, player},
        PRIORITY_INTERRUPT
    );

    assert.equal(dialogs.length, 1);
    assert.equal(
        dialogs[0].subtitle,
        'Si no eliges ninguna Interrupción más, sufrirás 5 de Daño en total.'
    );
});
