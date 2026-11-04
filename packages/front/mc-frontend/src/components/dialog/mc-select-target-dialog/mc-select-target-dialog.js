import {html} from 'lit-element';

import stylesCardList from '../mc-card-list-dialog/mc-card-list-dialog.css.js';
import {McCardListDialog} from '../mc-card-list-dialog/mc-card-list-dialog.js';

import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import styles from './mc-select-target-dialog.css.js';


export class McSelectTargetDialog extends McCardListDialog {
    static get is() {
        return 'mc-select-target-dialog';
    }
    static get styles() {
        return [stylesDialog, stylesCardList, styles];
    }
    constructor() {
        super(arguments[0]);
    }
    get defaultProperties() {
        return {
            ...super.defaultProperties,
            data: {
                ...super.defaultProperties.data,
                groups: [],
                showCounters: true,
                showLife: true,
                showDamage: false,
                multiSelect: false,
                upTo: false,
                count: 1,
                minCount: 1,
            },
        };
    }
    handleCardListSelect(e) {
        if (!this.data.multiSelect) {
            return super.handleCardListSelect(e);
        }

        const {card} = e.detail;
        const {cards, count} = this.data;
        const selected = Array.isArray(this._response.selected) ?
            this._response.selected.slice() :
            [];
        selected.push(card);
        const groups = this.data.groups?.map(group => ({
            ...group,
            cards: group.cards.filter(candidate =>
                candidate.id !== card.id),
        })).filter(group => group.cards.length);

        this.data = {
            ...this.data,
            cards: cards.filter(candidate => candidate.id !== card.id),
            ...(this.data.groups ? {groups} : {}),
        };
        this._response = {selected};

        if (selected.length === count || !this.data.cards.length) {
            this.sendResponse();
        }
    }
    validate() {
        if (!this.data.multiSelect) {
            return true;
        }

        const selected = Array.isArray(this._response.selected) ?
            this._response.selected.length :
            0;
        return selected >= this.data.minCount &&
            selected <= this.data.count &&
            (this.data.upTo || selected === this.data.count);
    }
    renderButtonOk() {
        return this.data.multiSelect && this.data.upTo ?
            super.renderButtonOk() :
            html``;
    }
    renderContent() {
        const {
            groups,
            showCounters,
            showLife,
            showDamage,
        } = this.data;

        if (!groups?.length) {
            return super.renderContent();
        }

        return html`
            <div class="target-groups">
                ${groups.map(({title, cards}) => html`
                    <section
                        class="target-group"
                        role="group"
                        aria-label="${title}"
                    >
                        <h3 class="target-group-title">${title}</h3>
                        <mc-card-list
                            .cards="${cards}"
                            .marked="${this._marked}"
                            .showGeneric="${showCounters}"
                            .showLife="${showLife}"
                            .showDamage="${showDamage}"
                            .selectOnClick="${true}"
                            @card-list-select="${this.handleCardListSelect.bind(this)}"
                        ></mc-card-list>
                    </section>
                `)}
            </div>
        `;
    }
}

window.customElements.define(McSelectTargetDialog.is, McSelectTargetDialog);
