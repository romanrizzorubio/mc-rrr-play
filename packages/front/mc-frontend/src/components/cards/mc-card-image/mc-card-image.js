import {LitElement, html} from 'lit-element';
import {
    ASPECT_IDS,
    TRAIT_ATTACK,
    TRAIT_THWART,
    translateAspect,
    translateTrait,
} from 'mc-shared';

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
            outlinedAspectMarkers: {type: Array},
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
        this.outlinedAspectMarkers = [];
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
        const eventMarkers = [TRAIT_ATTACK, TRAIT_THWART].filter(marker =>
            markers.includes(marker)
        );

        return aspectMarkers.length || eventMarkers.length ? html`
            <div class="aspect-markers">
                ${aspectMarkers.map(aspect => html`
                    <span
                        class="aspect-marker aspect-${aspect} ${this.outlinedAspectMarkers?.includes(aspect) ?
                            'outlined' :
                            ''}"
                        role="img"
                        aria-label="Aspecto jugado: ${translateAspect(aspect)}"
                        title="${translateAspect(aspect)}"
                    ></span>
                `)}
                ${eventMarkers.map(marker => {
                    const name = translateTrait(marker);
                    const used =
                        this.outlinedAspectMarkers?.includes(marker);
                    const label = used ?
                        `Respuesta de ${name} usada` :
                        `Evento de ${name} jugado`;

                    return html`
                        <span
                            class="aspect-marker aspect-${marker} ${used ?
                                'outlined' :
                                ''}"
                            role="img"
                            aria-label="${label}"
                            title="${label}"
                        ></span>
                    `;
                })}
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
