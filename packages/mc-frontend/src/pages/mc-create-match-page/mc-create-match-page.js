import {LitElement, html} from 'lit-element';

import styles from './mc-create-match-page.css.js';
import '../../components/views/mc-create-match/mc-create-match.js';
import {Api} from '../../components/api/api.js';
import {ConfigMatch} from '../../components/api/config-match.js';

export class McCreateMatchPage extends LitElement {
    static get is() {
        return 'mc-create-match-page';
    }
    static get styles() {
        return [styles];
    }
    static get properties() {
        return {
            scenario: {type: Object},
            heroesList: {type: Array},
            scenariosList: {type: Array},
            api: {type: Api},
        };
    }
    constructor() {
        super();

        this.player = null;
        this.scenario = null;
        this.heroesList = [];
        this.scenariosList = [];

        this.api = null;
        this.apiConfigMatch = null;
    }
    async connectedCallback() {
        super.connectedCallback();

        this.apiConfigMatch = new ConfigMatch(this.api);

        const [heroesList, scenariosList] = await Promise.all([
            this.getHeroesList(),
            this.getScenariosList(),
        ]);

        this.heroesList = heroesList;
        this.scenariosList = scenariosList;

        // TODO Carga automatica
        await this.handleCreate(new CustomEvent('create-match', {
            bubbles: true,
            composed: true,
            detail: {
                name: 'Prueba',
                player: {
                    name: 'RRR',
                    hero: 'she-hulk',
                },
                scenario: {
                    scenario: 'rhino'
                }
            }
        }));
    }
    getHeroesList() {
        return this.apiConfigMatch.getHeroesList();
    }
    getScenariosList() {
        return this.apiConfigMatch.getScenariosList();
    }
    async handleCreate(e) {
        const {apiConfigMatch} = this;
        const {name, player, scenario} = e.detail;

        await apiConfigMatch.createMatch({name});
        const createdPlayer = await apiConfigMatch.createPlayer(player);
        await apiConfigMatch.createScenario(scenario);
        const match = await apiConfigMatch.initMatch(false);

        this.dispatchEvent(new CustomEvent('match-created', {
            bubbles: true,
            composed: true,
            detail: {
                match,
                player: createdPlayer,
            }
        }));
    }
    render() {
        const {heroesList, scenariosList} = this;

        return html`
            <mc-create-match
                .heroesList="${heroesList}"
                .scenariosList="${scenariosList}"
                @create-match="${this.handleCreate.bind(this)}"
            ></mc-create-match>
        `;
    }
}

window.customElements.define(McCreateMatchPage.is, McCreateMatchPage);
