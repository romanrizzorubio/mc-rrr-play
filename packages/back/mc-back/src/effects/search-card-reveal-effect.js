import {DIALOG_SELECT_PLACES} from 'mc-shared';
import {checkCondition, path} from '../engine/utils.js';
import {ValidTarget} from '../targets/valid-target.js';
import {
    removeFromPlace,
    SET_ASIDE_PLACES,
} from '../utils/card-place-utils.js';

import {Effect} from './effect.js';
import {RevealEncounterEffect} from './reveal-encounter-effect.js';

export class SearchCardAndRevealEffect extends Effect {
    constructor({
        condition,
        excludeNames,
        places,
        revealAll = false,
    }) {
        super(arguments[0]);
        this.condition = condition;
        this.excludeNames = excludeNames === undefined ?
            [] :
            Array.isArray(excludeNames) ? excludeNames : [excludeNames];
        if (!this.excludeNames.length ||
            !this.excludeNames.every(excludePath =>
                typeof excludePath === 'string' &&
                excludePath.length > 0)) {
            if (excludeNames !== undefined) {
                throw new TypeError(
                    'SearchCardAndRevealEffect excludeNames must be a path or a list of paths.'
                );
            }
        }
        this.places = places;
        this.revealAll = revealAll;

        this.cards = [];
        this.hasEnteredGame = false;
        this.hasResolvedCard = false;
        this.location = undefined;
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.cards = [];
        this.hasEnteredGame = false;
        this.hasResolvedCard = false;
        this.location = undefined;
    }
    getExcludedNames(params) {
        return new Set(this.excludeNames.flatMap(excludePath => {
            const values = path(params, excludePath);

            return Array.isArray(values) ?
                values.flat(Infinity) :
                values === undefined ? [] : [values];
        }).filter(name => typeof name === 'string'));
    }
    checkCondition(card, _player, excludedNames) {
        const {condition} = this;

        return !excludedNames.has(card.name) &&
            checkCondition(card, condition);
    }
    removeRevealed(place, cards, player) {
        const remove = removeFromPlace.get(place);

        if (!remove) {
            throw new Error(`Unsupported card search place: ${place}`);
        }

        remove(this, cards, player);
    }
    search(place, player, params = {}) {
        const excludedNames = this.getExcludedNames(params);
        const validTarget = new ValidTarget({
            match: this.match,
            filter: card =>
                this.checkCondition(card, player, excludedNames),
        });

        return validTarget.getValidTarget({
            target: place,
            player,
        });
    }
    isFullResolved() {
        return this.hasResolvedCard;
    }
    async reveal(card, params, place) {
        const revealEncounterEffect = new RevealEncounterEffect({
            selectedTarget: card,
            match: this.match,
        });

        await revealEncounterEffect.runEffect({
            ...params,
            preventSurge: true,
        });
        this.location = place;
        this.hasResolvedCard = true;
        this.cards.push(card);
        if (SET_ASIDE_PLACES.has(place)) {
            this.hasEnteredGame = true;
        }
    }
    async execute(params) {
        const {player} = params;
        const {places, revealAll} = this;

        this.hasEnteredGame = false;
        this.hasResolvedCard = false;
        if (revealAll) {
            const cards = places.reduce((ret, place) => {
                const searched = this.search(place, player, params);

                this.removeRevealed(place, searched, player);

                return ret.concat(searched.map(card => ({card, place})));
            }, []);

            await this.promisesSequential(cards, async ({card, place}) => {
                await this.reveal(card, params, place);
            });

        } else {
            const seenNames = new Set();
            const cardPlaces = places.reduce((ret, place) => {
                const cardsPlace = this.search(place, player, params);
                const distinctNames = cardsPlace.filter(card => {
                    if (typeof card.name !== 'string' || !card.name) {
                        return true;
                    }
                    if (seenNames.has(card.name)) {
                        return false;
                    }

                    seenNames.add(card.name);

                    return true;
                });

                if (distinctNames.length) {
                    ret[place] = distinctNames;
                }

                return ret;
            }, {});

            const keys = Object.keys(cardPlaces);

            if (keys.length) {
                let place, card;
                if (keys.length === 1 && cardPlaces[keys[0]].length === 1) {
                    place = keys[0];
                    card = cardPlaces[place][0];
                } else {
                    const response = await this.openDialog({
                        dialogType: DIALOG_SELECT_PLACES,
                        targetPlayer: params.player,
                        title: this.title || 'Elige tu objetivo',
                        data: {
                            places: keys.reduce((ret, place) => {
                                ret[place] = cardPlaces[place]
                                    .map(card => card.toObj(arguments[0]));

                                return ret;
                            }, {}),
                        },
                    });
                    const selection = response?.selected;

                    if (!selection?.place || !selection.card?.id) {
                        throw new Error(
                            'La selección de la carta de Encuentro no es válida.',
                        );
                    }

                    place = selection.place;
                    const cardsAtPlace = cardPlaces[place];
                    if (!cardsAtPlace) {
                        throw new Error(
                            'La ubicación seleccionada para la carta de Encuentro no es válida.',
                        );
                    }

                    card = cardsAtPlace.find(_card =>
                        _card.id === selection.card.id);
                    if (!card) {
                        throw new Error(
                            'La carta seleccionada para mostrar no está disponible.',
                        );
                    }
                }

                this.removeRevealed(place, [card], player);
                await this.reveal(card, params, place);
            }
        }
    }
}