import assert from 'node:assert/strict';
import {test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
    mcStaticRemote: {
        getAssetUrl(path) {
            return `/static/${path}`;
        },
    },
};

const {ICON_EYE, ICON_EYE_SLASH, McIcon} = await import(
    '../src/components/common/mc-icon/mc-icon.js'
);

test('eye icons use SVG assets from the static remote', () => {
    const icon = Object.create(McIcon.prototype);
    const eye = icon.renderSvgIcon(ICON_EYE);
    const eyeSlash = icon.renderSvgIcon(ICON_EYE_SLASH);

    assert.match(eye.strings.join(''), /<img/);
    assert.equal(eye.values[0], '/static/icons/eye.svg');
    assert.match(eyeSlash.strings.join(''), /<img/);
    assert.equal(eyeSlash.values[0], '/static/icons/eye-slash.svg');
});
