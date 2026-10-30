import {LitElement, html} from 'lit-element';

import styles from './mc-defense.css.js';
import '../../cards/mc-card-list/mc-card-list.js';
import '../../common/mc-list/mc-list.js';
import {getCardAssetUrl} from '../../../misc/cards.js';

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
            players: {type: Array},
            mustDefend: {type: Boolean},
        };
    }
    constructor() {
        super();

        this.attack = {};
        this.defenders = [];
        this.players = [];
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
    handleRequestDefense(e, player) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('request-defense', {
            bubbles: true,
            composed: true,
            detail: {player},
        }));
    }
    renderOtherPlayers() {
        const players = this.players || [];
        return players.length ? html`
            <aside class="defense-requests" aria-label="Pedir a otro héroe que defienda">
                <h3>Pedir a otro héroe que defienda</h3>
                ${players.map(player => html`
                    <button
                        class="defense-player"
                        type="button"
                        @click="${event => this.handleRequestDefense(event, player)}"
                    >
                        <img
                            class="hero-thumbnail"
                            src="${getCardAssetUrl(player.image)}"
                            alt=""
                        >
                        <span class="player-name">${player.name}</span>
                    </button>
                `)}
            </aside>
        ` : html``;
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
                .emphasizedStats="${['defense']}"
                .selectOnClick="${true}"
                show-basic-stats
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
                .extraKeywords="${character.extraKeywords ?? []}"
                .isFacedownCard="${character.isFacedownCard}"
                size="s"
            ></mc-card>
        `;
    }
    render() {
        return html`
            <div class="defense-layout ${this.players?.length ? 'with-requests' : ''}">
                <div class="defense-main">
                    ${this.renderEnemy()}
                    ${this.renderParameters()}
                    ${this.renderDefenders()}
                </div>
                ${this.renderOtherPlayers()}
            </div>
        `;
    }
}

window.customElements.define(McDefense.is, McDefense);
