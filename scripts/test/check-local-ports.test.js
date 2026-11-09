import assert from 'node:assert/strict';
import {createServer} from 'node:net';
import {describe, it} from 'node:test';

import {assertLocalPortsAvailable} from '../utils/check-local-ports.js';

describe('local startup port checks', () => {
    it('allows startup when the requested port is free', async () => {
        const server = createServer();
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        const {port} = server.address();
        await new Promise(resolve => server.close(resolve));

        await assertLocalPortsAvailable([port]);
    });

    it('reports an occupied port without terminating its listener', async () => {
        const server = createServer();
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        const {port} = server.address();

        try {
            await assert.rejects(
                assertLocalPortsAvailable([port]),
                new RegExp(String(port)),
            );
            assert.equal(server.listening, true);
        } finally {
            await new Promise(resolve => server.close(resolve));
        }
    });
});
