import {html} from 'lit-element';

import styles from './mc-list-dialog.css.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import '../../cards/mc-card/mc-card.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';

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
        if (option.triggers) {
            return html`
                <md-list-item>
                    <div 
                        slot="headline" 
                        class="title-menu"
                    >${option.text}</div>
                </md-list-item>
                ${option.triggers.map(trigger => 
                    this.renderItem(trigger, true)
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
                    >${option.text}</div>
                </md-list-item>
            `;
        }
    }
    renderContent() {
        const {data: {options, card: {name, image}}} = this;

        return html`
            <mc-card
                name="${name}"
                image="${image}"
                size="m"
                hide-name
            ></mc-card>
            <md-list class="list">
                ${options.map(this.renderItem.bind(this))}
            </md-list>
        `;
    }
}

window.customElements.define(McListDialog.is, McListDialog);
