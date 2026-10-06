import {html} from 'lit-element';

import styles from './mc-assign-dialog.css.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import '../../cards/mc-card/mc-card.js';
import '@material/web/slider/slider.js';

import {BALL_STATUS_KO, BALL_STATUS_OK} from '../../common/mc-ball/mc-ball.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';
import {isPlanCard} from '../../../misc/utils.js';

export class McAssignDialog extends McDialog {
    static get is() {
        return 'mc-assign-dialog';
    }
    static get styles() {
        return [stylesDialog, styles];
    }
    constructor() {
        super(arguments[0]);
    }
    get defaultProperties() {
        return {
            data: {
                count: 0,
                field: '',
                cards: [],
            },
            _response: {
                assigned: {}
            }
        };
    }
    get maximum() {
        const {
            data: {count, cards, field},
        } = this;

        const maximum = cards.reduce((ret, card) => {
            const value = card[field] || 0;

            return ret + value;
        }, 0);

        return maximum < count ? maximum : count;
    }
    get assigned() {
        const {
            data: {cards},
            _response: {assigned},
        } = this;

        return cards.reduce((ret, card) => {
            const assignedCard = assigned[card.id] || 0;

            return ret + assignedCard;
        }, 0);
    }
    validate() {
        const {
            assigned,
            maximum,
        } = this;

        return maximum === assigned;
    }
    handleSlider(card) {
        return e => {
            e.stopPropagation();

            const slider = e.target;
            const {value} = slider;
            const {
                _response: {assigned},
            } = this;

            this._response = {
                ...this._response,
                assigned: {
                    ...assigned,
                    [card.id]: value,
                }
            };
        };
    }
    handleDefenseSelect(e) {
        const {card} = e.detail;

        this._response = {
            defender: card
        };

        this.sendResponse();
    }
    renderAssigned(card) {
        const {
            data: {count, field},
            _response: {assigned},
        } = this;

        const valueField = card[field];

        const value = assigned[card.id] || 0;
        const max = count > valueField ? valueField : count;

        return html`
            <div slot="bottom" class="assigned-slider">
                <md-slider 
                    min="0" 
                    max="${max}" 
                    value="${value}"
                    labeled
                    @change="${this.handleSlider(card)}"
                ></md-slider>
            </div>
        `;
    }
    renderCard(card) {
        const {name, image} = card;

        return html`
            <mc-card
                name="${name}"
                image="${image}"
                size="m"
                ?horizontal="${isPlanCard(card)}"
            >
                ${this.renderAssigned(card)}
            </mc-card>
        `;
    }
    renderStatus() {
        const {
            assigned,
            maximum,
        } = this;

        const statusText = assigned > maximum ?
            `Asignado ${assigned - maximum} de más` :
            assigned < maximum ?
                `Falta ${maximum - assigned} por asignar` :
                'Asignado correctamente';

        const statusBall = assigned === maximum ? BALL_STATUS_OK : BALL_STATUS_KO;

        return html`
            <h2 class="assigned">
                <mc-ball status="${statusBall}"></mc-ball>
                ${statusText}
            </h2>
        `;
    }
    renderContent() {
        const {data: {cards}} = this;

        return html`
                ${this.renderStatus()}
                <div class="cards">
                    ${cards.map(this.renderCard.bind(this))}
                </div>
            `;
    }
}

window.customElements.define(McAssignDialog.is, McAssignDialog);
