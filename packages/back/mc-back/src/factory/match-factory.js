import {Scenario} from '../model/match/scenario.js';
import {Superhero} from '../model/match/superhero.js';

import {ActivationsFactory} from './activations/activations-factory.js';
import {CardsFactory} from './cards/cards-factory.js';

export class MatchFactory {
    constructor(match) {
        this.match = match;
        this.copyIndexesByCardId = match.copyIndexesByCardId ??= new Map();

        this.cardsFactory = new CardsFactory(this);
        this.match.activationsFactory = new ActivationsFactory(this.match);
        this.match.effectsFactory = this.cardsFactory.abilitiesFactory.effectsFactory;
    }
    _createCollection(collection) {
        return collection.reduce((ret, {count, card}) => {
            const copies = this._createCopies(card, count);

            return ret.concat(copies);
        }, []);
    }
    _createCopies(cardConfig, count) {
        const copies = [];

        for (let i = 0 ; i < count ; i++) {
            if (Array.isArray(cardConfig.params?.sides)) {
                const cardId = cardConfig.params.sides.map(({type, params}) =>
                    `${type}:${params.name}:${params.stage ?? ''}`
                ).join('--');
                const index = (this.copyIndexesByCardId.get(cardId) || 0) + 1;
                this.copyIndexesByCardId.set(cardId, index);
                copies.push(this.cardsFactory.createGameCardFromConfig(cardConfig, {index}));
            } else {
                const card = this.cardsFactory.createCard(cardConfig);
                const index = (this.copyIndexesByCardId.get(card.id) || 0) + 1;
                this.copyIndexesByCardId.set(card.id, index);
                copies.push(this.cardsFactory.createGameCard({card, index}));
            }
        }

        return copies;
    }
    _getSets(sets) {
        return Promise.all(sets.map(async set => {
            const config = await this.match.mc.data.getSetConfig(set);

            const expertSet = config.expertSet &&
                this._createCollection(config.expertSet);

            return {
                ...config,
                cards: this._createCollection(config.cards),
                expertSet,
            };
        }));
    }
    async createScenario(params) {
        const {name} = params;
        const sequences = MatchFactory.getVillainConfigs(params);
        const villainCards = new Map();
        const villains = this._createVillains(sequences.villains, villainCards);
        const expertVillains = this._createVillains(sequences.expertVillains, villainCards);
        const mainSchemes = params.mainSchemes.map(side => {
            const sides = this.cardsFactory.createSides(side);

            return this.cardsFactory.createCardSides(sides);
        });
        const scenarioCards = this._createCollection(params.cards);
        const setAsideCards = this._createCollection(params.setAsideCards || []);

        const sets = (await this._getSets(params.sets))
            .concat(await this._getSets(params.defaultSets));

        return new Scenario({
            name,
            villains,
            expertVillains,
            mainSchemes,
            scenarioCards,
            setAsideCards,
            sets,
            manualVillainProgression: params.manualVillainProgression,
            manualMainSchemeProgression: params.manualMainSchemeProgression,
            separatePlayAreas: params.separatePlayAreas,
            match: this.match,
        });
    }
    _createVillains(configs, cards) {
        return configs.map(config => {
            const contextParams = new Set([
                config.params,
                ...(config.params.sides ?? []).map(side => side.params),
            ]);
            // Card factories attach the runtime match to printed card parameters.
            const key = JSON.stringify(config, function(name, value) {
                return name === 'match' && contextParams.has(this) ? undefined : value;
            });
            if (!cards.has(key)) {
                cards.set(key, this.cardsFactory.createGameCardFromConfig(config));
            }
            return cards.get(key);
        });
    }
    static getVillainConfigs(params) {
        if (params.villainsExpert !== undefined || params.extraVillains !== undefined) {
            throw new Error('Actualiza el catálogo: configura los Villanos únicamente en villains y expertVillains.');
        }
        if (!Array.isArray(params.villains) ||
            (params.expertVillains !== undefined && !Array.isArray(params.expertVillains))) {
            throw new TypeError('Las secuencias de Villanos deben ser listas de cartas.');
        }
        const legacyContent = params.mainSchemes?.[0]?.[0]?.params?.content;
        if (params.expertVillains === undefined && legacyContent?.villains) {
            if (params.manualVillainProgression) {
                throw new Error('Actualiza el catálogo: la progresión manual requiere villains y expertVillains en el escenario.');
            }
            const resolveStages = (stages, expert) => stages.map(stage => {
                const variants = params.villains.filter(config =>
                    (config.params.stage ?? config.params.sides?.[0]?.params.stage) === stage);
                const card = (expert ?
                    variants.find(config => config.params.expert === true) :
                    undefined) ?? variants.find(config => config.params.expert !== true);
                if (!card) {
                    throw new Error(`No se encontró la etapa ${stage} del Villano en la configuración antigua.`);
                }
                return card;
            });
            return {
                villains: resolveStages(legacyContent.villains, false),
                expertVillains: resolveStages(legacyContent.villainsExpert ?? legacyContent.villains, true),
            };
        }
        return {
            villains: params.villains,
            expertVillains: params.expertVillains ?? params.villains,
        };
    }
    createSuperhero(params) {
        const sides = this.cardsFactory.createSides(params.sides);
        const heroCards = this._createCollection(params.cards);
        const obligations = params.obligation ?
            this._createCopies(params.obligation.card, params.obligation.count) :
            [];
        const nemesis = this._createCollection(params.nemesis || []);
        const precon = this._createCollection(params.precon);
        const extraDecks = (params.extraDecks || []).map(({id, name, cards}) => ({
            id,
            name,
            cards: this._createCollection(cards),
        }));

        return new Superhero({
            sides,
            heroCards,
            obligations,
            nemesis,
            deck: precon,
            extraDecks,
            match: this.match,
        });
    }
}
