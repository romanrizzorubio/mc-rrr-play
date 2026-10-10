import {LitElement, html} from 'lit-element';

import styles from './mc-ball.css.js';

export const BALL_STATUS_OK = 'ok';
export const BALL_STATUS_KO = 'ko';
export class McBall extends LitElement {
    static get is() {
        return 'mc-ball';
    }
    static get styles() {
        return styles;
    }
    static get properties() {
        return {
            status:{type: String},
        };
    }
    constructor() {
        super();

        this.status = '';
    }
    render() {
        const {status} = this;

        return html`
            <span class="ball ${status}">
            </span>
        `;
    }
}

window.customElements.define(McBall.is, McBall);
