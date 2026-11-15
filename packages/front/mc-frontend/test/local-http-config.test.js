import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {describe, test} from 'node:test';

import {Api} from '../src/components/api/api.js';

const config = JSON.parse(readFileSync(
    new URL('../public/app-config.json', import.meta.url),
    'utf8',
));

describe('local HTTP application configuration', () => {
    test('all browser service and remote URLs use HTTP', () => {
        const urls = [
            ...Object.values(config.services),
            ...Object.values(config.remotes),
        ];

        assert.ok(urls.length > 0);
        assert.ok(urls.every(url => new URL(url).protocol === 'http:'));
    });

    test('the match service HTTP URL maps to a non-secure Socket.IO transport', () => {
        const api = new Api(config.services);

        assert.equal(api.wsHost, 'ws://localhost:3000/');
    });
});
