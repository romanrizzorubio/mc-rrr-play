import {html} from 'lit-element';

import styles from './mc-assign-dialog.css.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import '../../cards/mc-card/mc-card.js';

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
        const {count = 0, field, cards = []} = this.data || {};
        let remaining = Math.max(0, Number(count) || 0);
        const assigned = cards.reduce((result, card) => {
            const capacity = Math.max(0, Number(card[field]) || 0);
            const amount = Math.min(remaining, capacity);
            result[card.id] = amount;
            remaining -= amount;

            return result;
        }, {});

        return {
            data: {
                count: 0,
                field: '',
                cards: [],
            },
            _response: {
                assigned,
            }
        };
    }
    getCardMaximum(card) {
        const {
            data: {count, field},
        } = this;
        const damage = Math.max(0, Number(count) || 0);
        const capacity = Math.max(0, Number(card[field]) || 0);

        return Math.min(damage, capacity);
    }
    get maximum() {
        const {
            data: {count, cards},
        } = this;

        return Math.min(
            Math.max(0, Number(count) || 0),
            cards.reduce((total, card) =>
                total + this.getCardMaximum(card), 0)
        );
    }
    get assigned() {
        const {
            data: {cards},
            _response: {assigned},
        } = this;

        return cards.reduce((ret, card) => {
            const assignedCard = Number(assigned[card.id]) || 0;

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
            const current = Number(assigned[card.id]) || 0;
            const requested = Math.min(
                this.getCardMaximum(card),
                Math.max(0, Math.trunc(Number(value) || 0))
            );
            const nextAssigned = this.data.cards.reduce((result, currentCard) => {
                result[currentCard.id] =
                    Number(assigned[currentCard.id]) || 0;

                return result;
            }, {});
            const difference = requested - current;
            const superhero = this.data.cards.find(({isSuperhero}) =>
                isSuperhero
            );
            let adjusted = requested;

            if (difference > 0) {
                let remaining = difference;
                const unassigned = Math.max(0, this.maximum - this.assigned);
                const assignedFromUnallocated = Math.min(remaining, unassigned);
                adjusted = current + assignedFromUnallocated;
                remaining -= assignedFromUnallocated;

                const otherCards = this.data.cards.filter(({id}) =>
                    id !== card.id && id !== superhero?.id
                ).reverse();
                const sources = [
                    ...(superhero && superhero.id !== card.id ? [superhero] : []),
                    ...otherCards,
                ];

                sources.forEach(source => {
                    const sourceAssigned = nextAssigned[source.id];
                    const transferred = Math.min(remaining, sourceAssigned);
                    nextAssigned[source.id] = sourceAssigned - transferred;
                    adjusted += transferred;
                    remaining -= transferred;
                });
            } else if (difference < 0) {
                let remaining = -difference;
                const destinations = [
                    ...(superhero && superhero.id !== card.id ? [superhero] : []),
                    ...this.data.cards.filter(({id}) =>
                        id !== card.id && id !== superhero?.id
                    ),
                ];

                destinations.forEach(destination => {
                    const destinationAssigned = nextAssigned[destination.id];
                    const capacity = Math.max(
                        0,
                        this.getCardMaximum(destination) - destinationAssigned
                    );
                    const transferred = Math.min(remaining, capacity);
                    nextAssigned[destination.id] =
                        destinationAssigned + transferred;
                    remaining -= transferred;
                });
            }

            nextAssigned[card.id] = adjusted;

            this._response = {
                ...this._response,
                assigned: nextAssigned,
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
            _response: {assigned},
        } = this;

        const value = Number(assigned[card.id]) || 0;
        const max = this.getCardMaximum(card);

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
                .isFacedownCard="${card.isFacedownCard}"
                .canPeekFacedown="${Boolean(card.isFacedownCard && image)}"
                .life="${card.life}"
                .hitPoints="${card.hitPoints}"
                .statusCards="${card.statusCards}"
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
