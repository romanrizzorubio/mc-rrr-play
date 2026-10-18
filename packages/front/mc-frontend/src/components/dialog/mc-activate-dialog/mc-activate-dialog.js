import {html} from 'lit-element';

import styles from './mc-activate-dialog.css.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import '../../cards/mc-card/mc-card.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';
import {isPlanCard} from '../../../misc/utils.js';
import {getCardAssetUrl} from '../../../misc/cards.js';

const STATUS_IMAGES = {
    confused: {
        alt: 'Confundido',
        image: 'status/confused.webp',
    },
    stunned: {
        alt: 'Aturdido',
        image: 'status/stunned.webp',
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
                emphasizedStat: '',
                statusMessage: '',
                statusType: '',
            },
        };
    }
    renderCharacterCard(character, emphasizedStat) {
        return html`
            <mc-card
                .name="${character.name}"
                .image="${character.image}"
                .isFacedownCard="${character.isFacedownCard}"
                .canPeekFacedown="${Boolean(character.isFacedownCard && character.image)}"
                .life="${character.life}"
                .hitPoints="${character.hitPoints}"
                .attack="${character.attack}"
                .thwart="${character.thwart}"
                .defense="${character.defense}"
                .recovery="${character.recovery}"
                .scheme="${character.scheme}"
                .unprintedStats="${character.unprintedStats ?? []}"
                .emphasizedStats="${emphasizedStat ? [emphasizedStat] : []}"
                size="l"
                show-basic-stats
                ?horizontal="${isPlanCard(character)}"
            ></mc-card>
        `;
    }
    renderContent() {
        const {
            data: {
                character,
                target,
                emphasizedStat,
                statusMessage,
                statusType,
            },
        } = this;

        if (statusMessage) {
            const statusImage = STATUS_IMAGES[statusType];

            if (!statusImage) {
                throw new Error(`Unknown skipped activation status: ${statusType}`);
            }

            return html`
                <div class="activation-skipped">
                    <img
                        class="activation-status-image"
                        src="${getCardAssetUrl(statusImage.image)}"
                        alt="${statusImage.alt}"
                    >
                    <p>${statusMessage}</p>
                </div>
            `;
        }

        return html`
            ${this.renderCharacterCard(character, emphasizedStat)}
            <div class="vs">VS</div>
            ${this.renderCharacterCard(target)}
        `;
    }
}

window.customElements.define(McActivateDialog.is, McActivateDialog);
