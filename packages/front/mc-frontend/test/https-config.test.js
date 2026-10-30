import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {describe, test} from 'node:test';
import {runInNewContext} from 'node:vm';

import {Api} from '../src/components/api/api.js';

const config = JSON.parse(readFileSync(
    new URL('../public/app-config.json', import.meta.url),
    'utf8',
));
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const httpsRedirectScript = indexHtml.match(
    /<script id="https-redirect">([\s\S]*?)<\/script>/u,
)?.[1] ?? '';

const getRedirectedUrl = href => {
    let redirectedUrl;
    const location = {
        href,
        protocol: new URL(href).protocol,
        replace(url) {
            redirectedUrl = url;
        },
    };

    runInNewContext(httpsRedirectScript, {URL, window: {location}});
    return redirectedUrl;
};

describe('HTTPS application configuration', () => {
    test('redirects HTTP routes to HTTPS before loading the app module', () => {
        assert.ok(httpsRedirectScript);
        assert.ok(indexHtml.indexOf('id="https-redirect"') <
            indexHtml.indexOf('type="module"'));
        assert.equal(
            getRedirectedUrl('http://localhost:8000/match/abc?view=board#player'),
            'https://localhost:8000/match/abc?view=board#player',
        );
    });

    test('does not redirect an HTTPS URL', () => {
        assert.equal(getRedirectedUrl('https://localhost:8000/match/abc'), undefined);
    });

    test('all browser service and remote URLs use HTTPS', () => {
        const urls = [
            ...Object.values(config.services),
            ...Object.values(config.remotes),
        ];

        assert.ok(urls.length > 0);
        assert.ok(urls.every(url => new URL(url).protocol === 'https:'));
    });

    test('the match service HTTPS URL maps to a secure Socket.IO transport', () => {
        const api = new Api(config.services);

        assert.equal(api.wsHost, 'wss://localhost:3000/');
    });
});
