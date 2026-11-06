import {html} from 'lit-element';

import '../../cards/mc-card-list/mc-card-list.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import styles from './mc-reveal-cards-dialog.css.js';

export class McRevealCardsDialog extends McDialog {
    static get is() {
        return 'mc-reveal-cards-dialog';
    }
    static get styles() {
        return [stylesDialog, styles];
    }
    get defaultProperties() {
        return {
            ...super.defaultProperties,
            data: {
                ...super.defaultProperties.data,
                cards: [],
                rotatePlanCards: false,
                playFromPlace: null,
                selectable: false,
            },
        };
    }
    renderContent() {
        const {data: {cards, rotatePlanCards, playFromPlace, selectable}} = this;
        const cardsWithPlayability = playFromPlace ?
            cards.map(card => ({
                ...card,
                playable: card.playable ??
                    card.playFrom?.includes(playFromPlace) === true,
            })) :
            cards;

        return html`
            <mc-card-list
                .cards="${cardsWithPlayability}"
                .disabledCards="${[]}"
                .highlightPlayable="${Boolean(playFromPlace)}"
                .rotatePlanCards="${rotatePlanCards}"
                .selectOnClick="${Boolean(playFromPlace || selectable)}"
                @card-list-select="${this.handleSelectCard.bind(this)}"
            ></mc-card-list>
        `;
    }
    handleSelectCard(e) {
        if (this.viewOnly) {
            return;
        }

        const {data: {playFromPlace, selectable}} = this;
        const {card} = e.detail;

        if (selectable) {
            this._response = {selected: card};
            this.sendResponse();
            return;
        }

        if (!playFromPlace || card.playable !== true) {
            return;
        }

        this._response = {selected: card};
        this.sendResponse();
    }
    renderButtons() {
        if (this.viewOnly) {
            return super.renderButtons();
        }

        return html`
            <md-text-button
                @click="${this.handleOk.bind(this)}"
            >Continuar</md-text-button>
        `;
    }
}

window.customElements.define(McRevealCardsDialog.is, McRevealCardsDialog);
