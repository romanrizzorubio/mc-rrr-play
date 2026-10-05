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
        const {match, scenario, modularSets} = params;

        const matchFactory = new MatchFactory(match);

        if (scenario) {
            const scenarioConfig = {...await this.mc.data.getScenarioConfig(scenario)};
            const scenarioSets = scenarioConfig.sets || [];
            const scenarioDefaultSets = scenarioConfig.defaultSets || [];
            const configuredSetIds = [...new Set([
                ...scenarioSets,
                ...scenarioDefaultSets,
            ])];
            const setConfigs = new Map(await Promise.all(configuredSetIds.map(async id => [
                id,
                await this.mc.data.getSetConfig(id),
            ])));
            const configuredModularSets = configuredSetIds.filter(id =>
                setConfigs.get(id).standard === false
            );
            const selectedModularSets = modularSets === undefined ?
                configuredModularSets :
                modularSets;

            if (!Array.isArray(selectedModularSets) ||
                selectedModularSets.some(id => typeof id !== 'string' || !id)) {
                throw new Error('La selección de conjuntos modulares no es válida.');
            }
            if (new Set(selectedModularSets).size !== selectedModularSets.length) {
                throw new Error('La selección de conjuntos modulares contiene duplicados.');
            }

            for (const id of selectedModularSets) {
                const setConfig = setConfigs.get(id) || await this.mc.data.getSetConfig(id);
                if (setConfig.standard !== false) {
                    throw new Error(`"${id}" no es un conjunto modular seleccionable.`);
                }
            }

            const selectedSetIds = new Set(selectedModularSets);
            const isSelectedSet = id =>
                setConfigs.get(id).standard !== false || selectedSetIds.has(id);
            const configuredSetIdSet = new Set(configuredSetIds);

            scenarioConfig.sets = scenarioSets.filter(isSelectedSet);
            scenarioConfig.defaultSets = [
                ...scenarioDefaultSets.filter(isSelectedSet),
                ...selectedModularSets.filter(id => !configuredSetIdSet.has(id)),
            ];
            const scenarioCreated = await matchFactory.createScenario(scenarioConfig);
            match.addScenario(scenarioCreated);

            return scenarioCreated.toObj();
        }
    }
}