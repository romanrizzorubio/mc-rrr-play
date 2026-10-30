import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {createHttpsServiceServer} from '../src/https-server.js';

describe('HTTPS service server', () => {
    test('requires both a certificate and a private key path', () => {
        assert.throws(
            () => createHttpsServiceServer(() => {}, {
                certificatePath: '',
                keyPath: '',
            }),
            /TLS_CERT_PATH and TLS_KEY_PATH must be configured/u,
        );
    });
});
