import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    DIALOG_USE_CARD,
    PRIORITY_FORCED_RESPONSE,
    PRIORITY_INTERRUPT,
    TRIGGER_THIS_ATTACK,
    TRIGGER_VILLAIN_ATTACKS_YOU,
} from 'mc-shared';
import {Engine} from '../../src/engine/engine.js';
import {Match} from '../../src/model/match/match.js';
import {Trigger} from '../../src/triggers/base/trigger.js';
import {
    restoreMatch,
    serializeMatch,
} from '../../src/utils/match-serialization.js';

function createTrigger(card, name) {
    return new Trigger({
        ability: {
            hideDialog: false,
            id: `${card.id}--${name}`,
            isEndLasting: false,
            name,
            resolved: false,
            getTitle() {
                return this.name;
            },
        },
        card,
        trigger: TRIGGER_THIS_ATTACK,
    });
}

test('a single nested trigger option resolves its leaf trigger', async () => {
    const engine = new Engine();
    const player = {
        hand: {cards: []},
    };
    const card = {
        card: {},
        triggers: [{
            name: 'Resolver la obligación',
            triggers: [createTrigger({id: 'obligation'}, 'Agotar a Peter Parker')],
        }],
    };

    const selectedTrigger = await engine._openTriggersDialogTriggers(
        card,
        true,
        {player}
    );

    assert.equal(typeof selectedTrigger.runTrigger, 'function');
    assert.equal(selectedTrigger.ability.name, 'Agotar a Peter Parker');
});

test('optional triggered abilities prompt on every occurrence', async () => {
    const player = {
        hand: {
            cards: [],
        },
    };
    const card = {
        id: 'spider-man',
        owner: player,
        toObj: () => ({id: 'spider-man'}),
        triggers: {},
    };
    const ability = {
        effect: {
            isChoose: false,
            isChooseAbility: false,
        },
        hideDialog: false,
        id: 'spider-man--spider-sense',
        isEndLasting: false,
        isOptionAbility: false,
        name: 'Sentido arácnido',
        async canTrigger() {
            return true;
        },
        getTitle() {
            return this.name;
        },
        async resolveAbility() {
            this.resolved = true;
        },
    };
    const trigger = new Trigger({
        ability,
        card,
        trigger: TRIGGER_VILLAIN_ATTACKS_YOU,
    });
    card.triggers[TRIGGER_VILLAIN_ATTACKS_YOU] = {
        [PRIORITY_INTERRUPT]: [trigger],
    };
    const match = {
        triggerCards: {
            [card.id]: card,
        },
    };
    const engine = new Engine();
    const openedDialogs = [];

    engine.match = match;
    engine.openDialog = async dialog => {
        openedDialogs.push(dialog);
        return {
            selected: {id: card.id},
        };
    };

    const firstAttack = {};
    const secondAttack = {};

    await engine.trigger(
        PRIORITY_INTERRUPT,
        [TRIGGER_VILLAIN_ATTACKS_YOU],
        {effect: firstAttack, player}
    );
    await engine.trigger(
        PRIORITY_INTERRUPT,
        [TRIGGER_VILLAIN_ATTACKS_YOU],
        {effect: firstAttack, player}
    );
    await engine.trigger(
        PRIORITY_INTERRUPT,
        [TRIGGER_VILLAIN_ATTACKS_YOU],
        {effect: secondAttack, player}
    );

    assert.equal(
        openedDialogs.filter(dialog => dialog.dialogType === DIALOG_USE_CARD).length,
        2
    );
    assert.equal(trigger.triggered, true);
    assert.equal(ability.resolved, true);
});

test('trigger occurrence tracking stays outside persisted match snapshots', () => {
    const match = new Match({
        mc: {},
        name: 'trigger-occurrence-snapshot',
    });
    const card = {
        id: 'spider-man',
        owner: {},
        triggers: {},
    };
    const trigger = new Trigger({
        ability: {resolved: true},
        card,
        trigger: TRIGGER_VILLAIN_ATTACKS_YOU,
    });
    const effect = {};

    card.triggers[TRIGGER_VILLAIN_ATTACKS_YOU] = {
        [PRIORITY_INTERRUPT]: [trigger],
    };
    match.triggerCards[card.id] = card;
    trigger.markTriggeredFor(effect);

    const restoredMatch = restoreMatch(serializeMatch(match), {});
    const restoredTrigger = restoredMatch.triggerCards[card.id]
        .triggers[TRIGGER_VILLAIN_ATTACKS_YOU][PRIORITY_INTERRUPT][0];

    assert.equal(restoredTrigger.hasTriggeredFor({}), false);
});

test('informational dialog suppression is scoped to one trigger and its match', async () => {
    const match = new Match({
        mc: {},
        name: 'informational-dialog-match',
    });
    const engine = new Engine();
    const card = {
        id: 'black-panther',
        toObj: () => ({id: 'black-panther'}),
    };
    const params = {
        player: {
            hand: {
                cards: [],
            },
        },
    };
    const openedDialogs = [];

    engine.match = match;
    engine.openDialog = async dialog => {
        openedDialogs.push(dialog);
        return {
            selected: card,
            suppressedInformationalDialogId: dialog.data.informationalDialogId,
        };
    };

    const openDialogFor = (trigger, mandatory = true) => engine._openTriggersDialogCard(
        [card],
        {
            [card.id]: {
                card,
                triggers: [trigger],
            },
        },
        'Respuesta',
        mandatory,
        params,
        mandatory ? PRIORITY_FORCED_RESPONSE : 'response',
    );
    const retaliation = createTrigger(card, 'Represalia');

    await openDialogFor(retaliation);

    const retaliationDialogId = openedDialogs[0].data.informationalDialogId;
    assert.ok(retaliationDialogId);
    assert.deepEqual(match.suppressedInformationalDialogIds, [retaliationDialogId]);

    await openDialogFor(retaliation);
    assert.equal(openedDialogs.length, 1);

    await openDialogFor(createTrigger(card, 'Otra respuesta'));
    assert.equal(openedDialogs.length, 2);

    await openDialogFor(createTrigger(card, 'Respuesta opcional'), false);
    assert.equal(openedDialogs[2].data.informationalDialogId, undefined);
    assert.equal(match.suppressedInformationalDialogIds.length, 2);

    const restoredMatch = restoreMatch(serializeMatch(match), {});
    const newMatch = new Match({mc: {}, name: 'new-informational-dialog-match'});

    assert.deepEqual(
        restoredMatch.suppressedInformationalDialogIds,
        match.suppressedInformationalDialogIds
    );
    assert.deepEqual(newMatch.suppressedInformationalDialogIds, []);
});
