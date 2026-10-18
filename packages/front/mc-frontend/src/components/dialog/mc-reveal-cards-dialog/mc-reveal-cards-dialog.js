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
            },
        };
    }
    renderContent() {
        const {data: {cards, rotatePlanCards, playFromPlace}} = this;
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
                @card-list-select="${this.handleSelectCard.bind(this)}"
            ></mc-card-list>
        `;
    }
    handleSelectCard(e) {
        const {data: {playFromPlace}} = this;
        const {card} = e.detail;

        if (!playFromPlace || card.playable !== true) {
            return;
        }

        this._response = {selected: card};
        this.sendResponse();
    }
    renderButtons() {
        return html`
            <md-text-button
                @click="${this.handleOk.bind(this)}"
            >Continuar</md-text-button>
        `;
    }
}

window.customElements.define(McRevealCardsDialog.is, McRevealCardsDialog);
