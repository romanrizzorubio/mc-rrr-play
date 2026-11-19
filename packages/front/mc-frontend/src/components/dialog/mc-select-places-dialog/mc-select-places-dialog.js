import {html} from 'lit-element';

import styles from './mc-select-places-dialog.css.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import '../../cards/mc-card-list/mc-card-list.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';
import {getPlaceName} from '../../../utils/place-names.js';

export class McSelectPlacesDialog extends McDialog {
    static get is() {
        return 'mc-select-places-dialog';
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
                places: [],
            },
            _response: {
                selected: undefined
            }
        };
    }
    _handleSelectPlace(place) {
        return e => {
            const {card} = e.detail;

            this._response = {
                selected: {
                    place,
                    card,
                }
            };

            this.sendResponse();
        };
    }
    _renderPlace(place) {
        const {data: {places}} = this;
        const placeName = getPlaceName(place);

        return html`
            <div class="place-panel">
                <h3>${placeName}</h3>
                <mc-card-list
                    .cards="${places[place]}"
                    @card-list-select="${this._handleSelectPlace(place)}"
                ></mc-card-list>
            </div>
        `;
    }
    renderContent() {
        const {data: {places}} = this;

        return Object
            .keys(places)
            .map(this._renderPlace.bind(this));
    }
}

window.customElements.define(McSelectPlacesDialog.is, McSelectPlacesDialog);
