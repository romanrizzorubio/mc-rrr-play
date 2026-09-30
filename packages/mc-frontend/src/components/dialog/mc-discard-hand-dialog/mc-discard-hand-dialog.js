import stylesCardList from '../mc-card-list-dialog/mc-card-list-dialog.css.js';
import {McCardListDialog} from '../mc-card-list-dialog/mc-card-list-dialog.js';

import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import styles from './mc-discard-hand-dialog.css.js';


export class McDiscardHandDialog extends McCardListDialog {
    static get is() {
        return 'mc-discard-hand-dialog';
    }
    static get styles() {
        return [stylesDialog, stylesCardList, styles];
    }
    constructor() {
        super(arguments[0]);
    }
    get defaultProperties() {
        return {
            ...super.defaultProperties,
            data: {
                ...super.defaultProperties.data,
                count: 0,
                hand: 0,
                upTo: false,
            },
            _response: {
                ...super.defaultProperties._response,
                selected: [],
            }
        };
    }
    getTitle() {
        const {data: {count, hand, cards, upTo}, _response: {selected}} = this;

        let title;

        if (hand && cards.length > hand) {
            if (hand === 1) {
                title = `Descarta hasta tener ${hand} carta como máximo.`;
            } else {
                title = `Descarta hasta tener ${hand} cartas como máximo.`;
            }
        } else {
            if (upTo) {
                const selectedCount = selected.length;
                switch (count) {
                    case 1:
                        title = selectedCount > 0
                            ? `Descarta hasta 1 carta. (${selectedCount} descartada)`
                            : 'Descarta hasta 1 carta.';
                        break;
                    default:
                        title = selectedCount > 0
                            ? `Descarta hasta ${count} cartas. (${selectedCount} descartadas)`
                            : `Descarta hasta ${count} cartas.`;
                        break;
                }
            } else {
                switch (count) {
                    case 0:
                        title = 'Descarta las cartas que no quieras.';
                        break;
                    case 1:
                        title = 'Descarta 1 carta.';
                        break;
                    default:
                        title = `Descarta ${count} cartas.`;
                        break;
                }
            }
        }

        return title;
    }
    validate() {
        const {data: {hand, cards, upTo}, _response: {selected}} = this;

        if (upTo && selected.length >= 1) {
            return true;
        }

        return (cards.length <= hand);
    }
    handleCardListSelect(e) {
        const {card, cardIndex} = e.detail;
        const {data, _response} = this;
        const {count, cards, hand, upTo} = data;
        const {selected} = _response;

        cards.splice(cardIndex, 1);
        selected.push(card);

        if (hand === 0) {
            if (selected.length === count) {
                this.sendResponse();
            } else {
                this.data = {
                    ...data,
                    cards: cards.slice(),
                };
                this._response = {
                    ..._response,
                    selected
                };
            }
        } else if (count === 0) {
            if (cards.length) {
                this.data = {
                    ...data,
                    cards: cards.slice(),
                };
                this._response = {
                    ..._response,
                    selected
                };
            } else {
                this.sendResponse();
            }
        }
    }
}

window.customElements.define(McDiscardHandDialog.is, McDiscardHandDialog);
