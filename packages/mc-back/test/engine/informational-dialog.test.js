import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    PRIORITY_FORCED_RESPONSE,
    TRIGGER_THIS_ATTACK,
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
        },
        card,
        trigger: TRIGGER_THIS_ATTACK,
    });
}

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
