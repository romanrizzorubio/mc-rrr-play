import {html} from 'lit-element';

import styles from './mc-cards-group-dialog.css.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import '../../cards/mc-card/mc-card.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';
import {isPlanCard} from '../../../misc/utils.js';

export class McCardsGroupDialog extends McDialog {
    static get is() {
        return 'mc-cards-group-dialog';
    }
    static get styles() {
        return [stylesDialog, styles];
    }
    constructor() {
        super(arguments[0]);
    }
    get defaultProperties() {
        return {
            ...super.defaultProperties,
            data: {
                ...super.defaultProperties.data,
                groups: {},
            },
        };
    }
    renderCard(card) {
        return html`
            <mc-card
                name="${card.name}"
                image="${card.image}"
                .isFacedownCard="${card.isFacedownCard}"
                size="l"
                ?horizontal="${isPlanCard(card)}"
            ></mc-card>
        `;
    }
    renderGroup(group, cards) {
        return html`
            <div class="group">${group}</div>
            ${cards.map(this.renderCard.bind(this))}
        `;
    }
    renderContent() {
        const {data: {groups}} = this;

        return Object.keys(groups).map(group =>
            this.renderGroup(group, groups[group]));
    }
}

window.customElements.define(McCardsGroupDialog.is, McCardsGroupDialog);
