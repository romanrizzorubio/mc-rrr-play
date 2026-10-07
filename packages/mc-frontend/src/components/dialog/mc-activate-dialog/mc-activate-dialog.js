import {html} from 'lit-element';

import styles from './mc-activate-dialog.css.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import '../../cards/mc-card/mc-card.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';
import {isPlanCard} from '../../../misc/utils.js';
import {CARD_PATH} from '../../../misc/cards.js';

const STATUS_IMAGES = {
    confused: {
        alt: 'Confundido',
        src: `${CARD_PATH}status/confused.webp`,
    },
    stunned: {
        alt: 'Aturdido',
        src: `${CARD_PATH}status/stunned.webp`,
    },
};

export class McActivateDialog extends McDialog {
    static get is() {
        return 'mc-activate-dialog';
    }
    static get styles() {
        return [stylesDialog, styles];
    }
    constructor() {
        super(arguments[0]);
    }
    get className() {
        return 'activate';
    }
    get defaultProperties() {
        return {
            ...super.defaultProperties,
            data: {
                ...super.defaultProperties.data,
                character: null,
                target: null,
                statusMessage: '',
                statusType: '',
            },
        };
    }
    renderContent() {
        const {data: {character, target, statusMessage, statusType}} = this;

        if (statusMessage) {
            const statusImage = STATUS_IMAGES[statusType];

            if (!statusImage) {
                throw new Error(`Unknown skipped activation status: ${statusType}`);
            }

            return html`
                <div class="activation-skipped">
                    <img
                        class="activation-status-image"
                        src="${statusImage.src}"
                        alt="${statusImage.alt}"
                    >
                    <p>${statusMessage}</p>
                </div>
            `;
        }

        return html`
            <mc-card
                name="${character.name}"
                image="${character.image}"
                .isFacedownCard="${character.isFacedownCard}"
                size="l"
                ?horizontal="${isPlanCard(character)}"
            ></mc-card>
            <div class="vs">VS</div>
            <mc-card
                name="${target.name}"
                image="${target.image}"
                .isFacedownCard="${target.isFacedownCard}"
                size="l"
                ?horizontal="${isPlanCard(target)}"
            ></mc-card>
        `;
    }
}

window.customElements.define(McActivateDialog.is, McActivateDialog);
