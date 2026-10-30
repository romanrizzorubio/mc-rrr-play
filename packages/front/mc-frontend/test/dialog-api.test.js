import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {EVENTS} from 'mc-endpoints';
import {Dialog} from '../src/components/api/dialog.js';

describe('dialog API', () => {
    test('listens for completion of a targeted response dialog', () => {
        const listeners = [];
        const api = new Dialog({
            listen: listener => listeners.push(listener),
        });
        const callback = () => {};

        api.listenDialogComplete(callback);

        assert.deepEqual(listeners, [{
            event: EVENTS.DIALOG.COMPLETE,
            callback,
        }]);
    });
});
