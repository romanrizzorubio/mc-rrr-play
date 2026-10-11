import {html} from 'lit-element';

import {
    ICON_ADVANCE,
    ICON_AMPLIFICATION,
    ICON_BOOST,
    ICON_CRISIS,
    ICON_ENERGY,
    ICON_HAZARD,
    ICON_MENTAL,
    ICON_PHYSICAL,
    ICON_STAR,
    ICON_WILD,
} from '../components/common/mc-icon/mc-icon.js';

const SUPPORTED_ICONS = new Set([
    ICON_ADVANCE,
    ICON_AMPLIFICATION,
    ICON_BOOST,
    ICON_CRISIS,
    ICON_ENERGY,
    ICON_HAZARD,
    ICON_MENTAL,
    ICON_PHYSICAL,
    ICON_STAR,
    ICON_WILD,
]);
const ICON_PATTERN = /\[([a-zA-Z])\]/g;

export function renderTextWithIcons(text) {
    const parts = [];
    let lastIndex = 0;

    for (const match of text.matchAll(ICON_PATTERN)) {
        const [token, icon] = match;
        if (!SUPPORTED_ICONS.has(icon)) {
            continue;
        }

        parts.push(text.slice(lastIndex, match.index));
        parts.push(html`<mc-icon icon="${icon}"></mc-icon>`);
        lastIndex = match.index + token.length;
    }

    parts.push(text.slice(lastIndex));

    return html`${parts}`;
}
