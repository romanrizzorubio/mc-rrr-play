import {LitElement, html} from 'lit-element';
import styles from './mc-form-match.css.js';

import '@material/web/button/filled-button.js';
import '@material/web/textfield/filled-text-field.js';

export class McFormMatch extends LitElement {
    static get is() {
        return 'mc-form-match';
    }
    static get styles() {
        return [styles];
    }

    static get properties() {
        return {
            name: {type: String}
        };
    }

    constructor() {
        super();

        this.name = '';
    }

    handleChange(e) {
        this.name = e.target.value;
    }

    handleClick() {
        //const match = new Match(this.name);
        this.dispatchEvent(new CustomEvent('created', {detail: {name: this.name}}));
    }

    render() {
        return html`
            <md-filled-text-field 
                @change="${this.handleChange}"
            >${this.name}</md-filled-text-field>
            <md-filled-button
                @click="${this.handleClick}"
            >
                Crear partida
            </md-filled-button>
        `;
    }
}

window.customElements.define(McFormMatch.is, McFormMatch);
