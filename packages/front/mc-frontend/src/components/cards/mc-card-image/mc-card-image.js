import {LitElement, html} from 'lit-element';
import {ASPECT_IDS, translateAspect} from 'mc-shared';

import styles from './mc-card-image.css.js';

export class McCardImage extends LitElement {
    static get is() {
        return 'mc-card-image';
    }
    static get styles() {
        return styles;
    }
    static get properties() {
        return {
            src: {type: String},
            size: {type: String},
            horizontal: {type: Boolean},
            rotated: {type: Boolean, reflect: true},
            aspectMarkers: {type: Array},
            activationBlocked: {
                type: Boolean,
                attribute: 'activation-blocked',
                reflect: true,
            },
        };
    }
    constructor() {
        super();

        this.src = '';
        this.size = 'm';
        this.horizontal = false;
        this.rotated = false;
        this.aspectMarkers = [];
        this.activationBlocked = false;
    }
    getOrientationClass() {
        return this.horizontal ? 'horizontal' : 'vertical';
    }
    renderAspectMarkers() {
        const markers = this.aspectMarkers ?? [];
        const aspectMarkers = ASPECT_IDS.filter(aspect =>
            markers.includes(aspect)
        );

        return aspectMarkers.length ? html`
            <div class="aspect-markers">
                ${aspectMarkers.map(aspect => html`
                    <span
                        class="aspect-marker aspect-${aspect}"
                        role="img"
                        aria-label="Aspecto jugado: ${translateAspect(aspect)}"
                        title="${translateAspect(aspect)}"
                    ></span>
                `)}
            </div>
        ` : '';
    }
    render() {
        const {size} = this;
        const classes = [
            this.getOrientationClass(),
            `size-${size}`,
            this.rotated ? 'rotated' : '',
        ].filter(Boolean).join(' ');

        return html`
            <img
                class="${classes}"
                src="${this.src}" 
            />
            ${this.renderAspectMarkers()}
        `;
    }
}

window.customElements.define(McCardImage.is, McCardImage);
