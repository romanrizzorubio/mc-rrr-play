import {html} from 'lit-element';

import styles from './mc-list-dialog.css.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import '../../cards/mc-card/mc-card.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';
import {isPlanCard} from '../../../misc/utils.js';
import {getCardAssetUrl} from '../../../misc/cards.js';
import {renderTextWithFormatting} from '../../../utils/render-text-with-formatting.js';

export class McListDialog extends McDialog {
    static get is() {
        return 'mc-list-dialog';
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
                options: [],
                card: {},
                contextCards: [],
                showCounters: false,
            },
            _response: {
                selected: undefined
            }
        };
    }
    handleClick(option) {
        return e => {
            e.stopPropagation();

            if (option.disable) {
                return;
            }

            const {_response} = this;

            this._response = {
                ..._response,
                selected: option,
            };

            this.sendResponse();
        };
    }
    renderItem(option, submenu = false) {
        const text = typeof option.text === 'string' ?
            renderTextWithFormatting(option.text) :
            option.text;
        const content = option.image ? html`
            <div class="option-content">
                <img
                    class="option-image"
                    src="${getCardAssetUrl(option.image)}"
                    alt=""
                >
                <span class="option-text">${text}</span>
            </div>
        ` : text;

        if (option.triggers) {
            return html`
                ${option.text ? html`<md-list-item>
                    <div 
                        slot="headline" 
                        class="title-menu"
                    >${content}</div>
                </md-list-item>` : ''}
                ${option.triggers.map(trigger => 
                    this.renderItem(trigger, Boolean(option.text))
                )}
            `;
        } else {
            return html`
                <md-list-item
                    interactive
                    type="button"
                    .disabled="${Boolean(option.disable)}"
                    @click="${this.handleClick(option)}"
                >
                    <div 
                        slot="headline"
                        class="${submenu === false ? '' : 'submenu'}"
                    >${content}</div>
                </md-list-item>
            `;
        }
    }
    renderContextCards(contextCards, sourceCard, showCounters) {
        const hasSourceCard = Boolean(
            sourceCard.image || sourceCard.isFacedownCard
        );

        return contextCards.length ? html`
            <div class="context-cards" role="group" aria-label="Cartas relacionadas">
                ${hasSourceCard ? html`
                    <div class="context-card context-card-source">
                        <mc-card
                            name="${sourceCard.name}"
                            image="${sourceCard.image}"
                            .isFacedownCard="${Boolean(
                                sourceCard.isFacedownCard
                            )}"
                            .canPeekFacedown="${Boolean(
                                sourceCard.isFacedownCard && sourceCard.image
                            )}"
                            .generic="${showCounters ?
                                sourceCard.counters :
                                undefined}"
                            size="m"
                            ?horizontal="${isPlanCard(sourceCard)}"
                            .showGeneric="${showCounters}"
                            hide-name
                        ></mc-card>
                    </div>
                ` : ''}
                ${contextCards.map(({card, label}, index) => html`
                    ${hasSourceCard || index ? html`
                        <div
                            class="context-card-separator"
                            role="separator"
                            aria-orientation="vertical"
                        ></div>
                    ` : ''}
                    <div class="context-card">
                        <div class="context-card-label">${label}</div>
                        ${card.image || card.isFacedownCard ? html`
                            <mc-card
                                .card="${card}"
                                name="${card.name}"
                                image="${card.image}"
                                .isFacedownCard="${Boolean(card.isFacedownCard)}"
                                .canPeekFacedown="${Boolean(
                                    card.isFacedownCard && card.image
                                )}"
                                size="m"
                                ?horizontal="${isPlanCard(card)}"
                                hide-name
                            ></mc-card>
                        ` : ''}
                    </div>
                `)}
            </div>
        ` : html``;
    }
    renderContent() {
        const {
            data: {options, card, contextCards = [], showCounters},
        } = this;
        const {name, image, counters} = card;

        return html`
            ${contextCards.length ?
                this.renderContextCards(contextCards, card, showCounters) :
                image || card.isFacedownCard ? html`
                <mc-card
                    name="${name}"
                    image="${image}"
                    .isFacedownCard="${card.isFacedownCard}"
                    .canPeekFacedown="${Boolean(card.isFacedownCard && image)}"
                    .generic="${showCounters ? counters : undefined}"
                    size="m"
                    ?horizontal="${isPlanCard(card)}"
                    .showGeneric="${showCounters}"
                    hide-name
                ></mc-card>
                ` : ''}
            <md-list class="list">
                ${options.map(this.renderItem.bind(this))}
            </md-list>
        `;
    }
}

window.customElements.define(McListDialog.is, McListDialog);
