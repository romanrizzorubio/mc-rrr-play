import {DIALOG_SELECT_PLACES} from 'mc-shared';
import {checkCondition} from '../engine/utils.js';
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
        places,
        revealAll = false,
    }) {
        super(arguments[0]);
        this.condition = condition;
        this.condition = condition;
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
    checkCondition(card, _player) {
        const {condition} = this;

        return checkCondition(card, condition);
    }
    removeRevealed(place, cards, player) {
        const remove = removeFromPlace.get(place);

        if (!remove) {
            throw new Error(`Unsupported card search place: ${place}`);
        }

        remove(this, cards, player);
    }
    search(place, player) {
        const validTarget = new ValidTarget({
            match: this.match,
            filter: this.checkCondition.bind(this),
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
                const searched = this.search(place, player);

                this.removeRevealed(place, searched, player);

                return ret.concat(searched.map(card => ({card, place})));
            }, []);

            await this.promisesSequential(cards, async ({card, place}) => {
                await this.reveal(card, params, place);
            });

        } else {
            const seenNames = new Set();
            const cardPlaces = places.reduce((ret, place) => {
                const cardsPlace = this.search(place, player);
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