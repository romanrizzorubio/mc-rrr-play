import {ENDPOINTS} from 'mc-endpoints';
import {MatchFactory} from '../../factory/match-factory.js';

export class ScenarioRest {
    constructor(rest) {
        this.rest = rest;
    }
    get mc() {
        return this.rest.mc;
    }
    createEndpoints() {
        this.rest.post(ENDPOINTS.SCENARIO.CREATE, this.createScenario.bind(this));
    }
    async createScenario(params) {
        const {match, scenario} = params;

        const matchFactory = new MatchFactory(match);

        if (scenario) {
            const {scenarioConfig} = await import(`../../../data/scenarios/${scenario}/index.js`);
            const scenarioCreated = await matchFactory.createScenario(scenarioConfig);
            match.addScenario(scenarioCreated);

            return scenarioCreated.toObj();
        }
    }
}