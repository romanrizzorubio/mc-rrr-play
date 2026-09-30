import {html} from 'lit-element';

import '../../cards/mc-card-list/mc-card-list.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';

export class McCardListDialog extends McDialog {
    constructor() {
        super(arguments[0]);

        this._marked = [];
    }
    get defaultProperties() {
        return {
            data: {
                cards: [],
                showCounters: false,
            },
            _response: {
                selected: undefined
            }
        };
    }
    handleCardListSelect(e) {
        const {card} = e.detail;

        this._response = {
            selected: card
        };

        this.sendResponse();
    }
    renderContent() {
        const {data: {cards, showCounters}, _marked} = this;

        return html`
            <mc-card-list
                .cards="${cards}"
                .marked="${_marked}"
                .showCounters="${showCounters}"
                @card-list-select="${this.handleCardListSelect.bind(this)}"
            ></mc-card-list>
        `;
    }
}
