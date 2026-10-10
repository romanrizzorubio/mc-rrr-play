import {html} from 'lit-element';

import {ICON_BOOST} from '../components/common/mc-icon/mc-icon.js';

export function renderBoostIcons(count) {
    const iconCount = Number.isFinite(count) && count > 0 ?
        Math.floor(count) :
        0;

    return Array.from({length: iconCount}, () =>
        html`<mc-icon icon="${ICON_BOOST}"></mc-icon>`
    );
}
