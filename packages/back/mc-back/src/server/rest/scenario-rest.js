import {INTERNAL_ENDPOINTS} from 'mc-endpoints';
import {MatchFactory} from '../../factory/match-factory.js';
import {AuthServiceClient} from '../../utils/auth-service-client.js';

export class ScenarioRest {
    constructor(rest) {
        this.rest = rest;
    }
    get mc() {
        return this.rest.mc;
    }
    createEndpoints() {
        this.rest.post(
            INTERNAL_ENDPOINTS.SCENARIO.CREATE,
            this.createScenario.bind(this)
        );
    }
    async createScenario(params) {
        const {match} = params;
        let {scenario, modularSets} = params;

        if (match?.lobbyId) {
            const user = await AuthServiceClient.authenticate(params.cookie);
            if (user.id !== match.creatorUserId) {
                const error = new Error('Solo el creador puede configurar esta partida.');
                error.statusCode = 403;
                throw error;
            }

            const lobby = await this.mc.data.getMatchLobby(match.lobbyId);
            if (!lobby || lobby.status !== 'starting' ||
                lobby.creatorId !== match.creatorUserId) {
                const error = new Error('La sala ya no está disponible para configurar el escenario.');
                error.statusCode = 409;
                throw error;
            }

            scenario = lobby.scenario.id;
            modularSets = lobby.scenario.modularSets;
        }

        if (match?.lobbyId && match.scenario) {
            return match.scenario.toObj();
        }

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
            const configuredModularSets = scenarioDefaultSets.filter(id =>
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
            const isSelectedDefaultSet = id =>
                setConfigs.get(id).standard !== false || selectedSetIds.has(id);
            const configuredSetIdSet = new Set(configuredSetIds);

            scenarioConfig.sets = scenarioSets;
            scenarioConfig.defaultSets = [
                ...scenarioDefaultSets.filter(isSelectedDefaultSet),
                ...selectedModularSets.filter(id => !configuredSetIdSet.has(id)),
            ];
            match.creationConfig ??= {players: [], scenario: null, expert: false};
            match.creationConfig.scenario = structuredClone(scenarioConfig);
            const scenarioCreated = await matchFactory.createScenario(scenarioConfig);
            match.addScenario(scenarioCreated);

            return scenarioCreated.toObj();
        }
    }
}