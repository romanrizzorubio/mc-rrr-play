import {LitElement, html} from 'lit-element';

import styles from './mc-defense.css.js';
import '../../cards/mc-card-list/mc-card-list.js';
import '../../common/mc-list/mc-list.js';

export class McDefense extends LitElement {
    static get is() {
        return 'mc-defense';
    }
    static get styles() {
        return styles;
    }
    static get properties() {
        return {
            attack: {type: Object},
            defenders: {type: Array},
            mustDefend: {type: Boolean},
        };
    }
    constructor() {
        super();

        this.attack = {};
        this.defenders = [];
        this.mustDefend = false;
    }
    getParameters() {
        const {attack} = this;
        const {character, boostCards, overkill, piercing, ranged} = attack;

        const parameters = [{
            text: character.attack,
            header: 'Ataque básico'
        }];

        if (boostCards.length) {
            parameters.push({
                text: boostCards.length,
                header: 'Cartas de aumento'
            });
        }

        if (overkill) {
            parameters.push({
                text: 'Brutalidad',
            });
        }
        if (piercing) {
            parameters.push({
                text: 'Penetrante',
            });
        }
        if (ranged) {
            parameters.push({
                text: 'A distancia',
            });
        }

        return parameters;
    }
    handleSelectDefender(e) {
        const {card, cardIndex} = e.detail;

        this.dispatchEvent(new CustomEvent('select-defender', {
            bubbles: true,
            composed: true,
            detail: {card, cardIndex}
        }));
    }
    renderDefenders() {
        const {defenders, mustDefend} = this;
        const prompt = mustDefend ?
            'Debes elegir un defensor para este ataque' :
            'Selecciona defensor o pulsa Ok para continuar sin defender';

        return html`
            <h3>${prompt}</h3>
            <mc-card-list
                .cards="${defenders}"
                show-life
                show-generic
                @card-list-select="${this.handleSelectDefender.bind(this)}"
            ></mc-card-list>
        `;
    }
    renderParameters() {
        return html`
            <mc-list
                .list="${this.getParameters()}"
            ></mc-list>
        `;
    }
    renderEnemy() {
        const {attack: {character}} = this;

        return html`
            <mc-card
                name="${character.name}"
                image="${character.image}"
                .isFacedownCard="${character.isFacedownCard}"
                size="s"
            ></mc-card>
        `;
    }
    render() {
        return html`
            ${this.renderEnemy()}
            ${this.renderParameters()}
            ${this.renderDefenders()}
        `;
    }
}

window.customElements.define(McDefense.is, McDefense);
