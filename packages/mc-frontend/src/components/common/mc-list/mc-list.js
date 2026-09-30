import {LitElement, html} from 'lit-element';

import styles from './mc-list.css.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';

export class McList extends LitElement {
    static get is() {
        return 'mc-list';
    }
    static get styles() {
        return styles;
    }

    static get properties() {
        return {
            list: {type: Array},
        };
    }

    constructor() {
        super(arguments[0]);

        this.list = [];
    }

    renderHeader(text) {
        return text ? html`
            <header>${text}</header>
        ` : html``;
    }

    renderSubText(text) {
        return text ? html`
            <div slot="supporting-text">${text}</div>
        ` : html``;
    }

    renderListItem(item) {
        const {header = '', text = '', subText = ''} = item;

        return html`
            <md-list-item>
                ${this.renderHeader(header)}
                ${text}
                ${this.renderSubText(subText)}
            </md-list-item>
        `;
    }

    renderListItems() {
        const {list} = this;

        return list.map(this.renderListItem.bind(this));
    }

    render() {
        return html`
            <md-list>
                ${this.renderListItems()}
            </md-list>        
        `;
    }
}

window.customElements.define(McList.is, McList);
