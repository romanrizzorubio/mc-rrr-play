import {DIALOG_SELECT_PLACES} from '../constants/dialogs.js';
import {PLACE_ENCOUNTER_DECK_CARDS, PLACE_OUTSIDE_NEMESIS} from '../constants/places.js';
import {checkCondition} from '../engine/utils.js';
import {ValidTarget} from '../targets/valid-target.js';

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
        this.places = places;
        this.revealAll = revealAll;

        this.cards = [];
    }
    checkCondition(card, _player) {
        const {condition} = this;

        return checkCondition(card, condition);
    }
    removeRevealed(place, cards, player) {
        switch (place) {
            case PLACE_ENCOUNTER_DECK_CARDS:
                cards.forEach(card => {
                    this.match.removeCardFromEncountersDeck(card);
                });
                break;
            case PLACE_OUTSIDE_NEMESIS:
                cards.forEach(card => {
                    const index = player.superhero.nemesis.indexOf(card);
                    if (index > -1) {
                        player.superhero.nemesis.splice(index, 1);
                    }
                });
        }
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
        return this.hasEnterGame;
    }
    reveal(card, params) {
        const revealEncounterEffect = new RevealEncounterEffect({
            selectedTarget: card,
            match: this.match,
        });

        this.hasEnterGame = true;
        return revealEncounterEffect.runEffect({
            ...params,
            preventSurge: true,
        });
    }
    async execute(params) {
        const {player} = params;
        const {places, revealAll} = this;

        this.hasEnterGame = false;
        if (revealAll) {
            const cards = places.reduce((ret, place) => {
                const searched = this.search(place, player);

                this.removeRevealed(place, searched, player);

                return ret.concat(searched);
            }, []);

            await this.promisesSequential(cards, async card => {
                await this.reveal(card, params);
            });

        } else {
            const cardPlaces = places.reduce((ret, place) => {
                const cardsPlace = this.search(place, player);

                if (cardsPlace.length) {
                    ret[place] = cardsPlace;
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
                    const selected = await this.openDialog({
                        dialogType: DIALOG_SELECT_PLACES,
                        title: 'Elige tu objetivo',
                        data: {
                            places: keys.reduce((ret, place) => ({
                                [place]: cardPlaces[place]
                                    .map(card =>
                                        card.toObj(arguments[0]))
                            }), {}),
                        },
                    });

                    place = selected.place;
                    card = cardPlaces[place].find(_card => _card.id === selected.card.id);
                }

                this.removeRevealed(place, [card], player);
                await this.reveal(card, params);
            }
        }
    }
}