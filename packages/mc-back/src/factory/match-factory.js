import {Scenario} from '../model/match/scenario.js';
import {Superhero} from '../model/match/superhero.js';

import {ActivationsFactory} from './activations-factory.js';
import {CardsFactory} from './cards-factory.js';

export class MatchFactory {
    constructor(match) {
        this.match = match;

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
            const card = this.cardsFactory.createCard(cardConfig);
            copies.push(this.cardsFactory.createGameCard({
                card,
                index: i+1,
            }));
        }

        return copies;
    }
    _getSets(sets) {
        return Promise.all(sets.map(async set => {
            const {config} = await import(`../../data/sets/${set}/index.js`);

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
        const villains = params.villains.map(cardConfig => {
            const card = this.cardsFactory.createCard(cardConfig);

            return this.cardsFactory.createGameCard({
                card,
            });
        });
        const mainSchemes = params.mainSchemes.map(side => {
            const sides = this.cardsFactory.createSides(side);

            return this.cardsFactory.createCardSides(sides);
        });
        const scenarioCards = this._createCollection(params.cards);

        const sets = (await this._getSets(params.sets))
            .concat(await this._getSets(params.defaultSets));

        return new Scenario({
            name,
            villains,
            mainSchemes,
            scenarioCards,
            sets,
            match: this.match,
        });
    }
    createSuperhero(params) {
        const sides = this.cardsFactory.createSides(params.sides);
        const heroCards = this._createCollection(params.cards);
        const obligations = this._createCopies(params.obligation.card, params.obligation.count);
        const nemesis = this._createCollection(params.nemesis);
        const precon = this._createCollection(params.precon);

        return new Superhero({
            sides,
            heroCards,
            obligations,
            nemesis,
            deck: precon,
            match: this.match,
        });
    }
}
