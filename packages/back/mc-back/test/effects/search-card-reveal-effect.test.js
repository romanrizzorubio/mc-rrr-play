import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    PLACE_ASIDE_MATCH,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    PLACE_OUTSIDE_NEMESIS,
} from 'mc-shared';
import {DoIfEffect} from '../../src/effects/do-if-effect.js';
import {SearchCardAndRevealEffect} from '../../src/effects/search-card-reveal-effect.js';
import standard from '../../../mc-data/seed/catalog/sets/standard.js';

describe('SearchCardAndRevealEffect', () => {
    test('reveals the first matching copy without asking which duplicate to use', async () => {
        const firstCopy = {id: 'first-copy', name: 'Sujetos de prueba'};
        const secondCopy = {id: 'second-copy', name: 'Sujetos de prueba'};
        const removed = [];
        const revealed = [];
        let dialogOpened = false;
        const effect = new SearchCardAndRevealEffect({
            match: {},
            places: [
                PLACE_ENCOUNTER_DECK_CARDS,
                PLACE_ENCOUNTER_DISCARD,
            ],
        });
        effect.search = place => place === PLACE_ENCOUNTER_DECK_CARDS ?
            [firstCopy] :
            [secondCopy];
        effect.removeRevealed = (place, cards) => {
            removed.push({place, card: cards[0]});
        };
        effect.reveal = async (card, _params, place) => {
            revealed.push({place, card});
        };
        effect.openDialog = async () => {
            dialogOpened = true;
        };

        await effect.execute({player: {}});

        assert.deepEqual(removed, [{
            place: PLACE_ENCOUNTER_DECK_CARDS,
            card: firstCopy,
        }]);
        assert.deepEqual(revealed, [{
            place: PLACE_ENCOUNTER_DECK_CARDS,
            card: firstCopy,
        }]);
        assert.equal(dialogOpened, false);
    });

    test('keeps one option per name when different matching cards remain', async () => {
        const firstCopy = {
            id: 'first-copy',
            name: 'Sujetos de prueba',
            toObj() {
                return {id: this.id, name: this.name};
            },
        };
        const duplicateCopy = {
            id: 'duplicate-copy',
            name: 'Sujetos de prueba',
            toObj() {
                return {id: this.id, name: this.name};
            },
        };
        const otherCard = {
            id: 'other-card',
            name: 'Otro esbirro',
            toObj() {
                return {id: this.id, name: this.name};
            },
        };
        let dialogPlaces;
        let dialogTitle;
        let removed;
        const revealed = [];
        const effect = new SearchCardAndRevealEffect({
            match: {},
            places: [
                PLACE_ENCOUNTER_DECK_CARDS,
                PLACE_ENCOUNTER_DISCARD,
            ],
            title: 'Elige el Esbirro a mostrar',
        });
        effect.search = place => place === PLACE_ENCOUNTER_DECK_CARDS ?
            [firstCopy, duplicateCopy] :
            [otherCard];
        effect.removeRevealed = (place, cards) => {
            removed = {place, card: cards[0]};
        };
        effect.reveal = async card => {
            revealed.push(card);
        };
        effect.openDialog = async ({data, title}) => {
            dialogPlaces = data.places;
            dialogTitle = title;

            return {
                selected: {
                    place: PLACE_ENCOUNTER_DISCARD,
                    card: {id: otherCard.id},
                },
            };
        };

        await effect.execute({player: {}});

        assert.equal(dialogPlaces[PLACE_ENCOUNTER_DECK_CARDS].length, 1);
        assert.equal(dialogPlaces[PLACE_ENCOUNTER_DISCARD].length, 1);
        assert.equal(dialogTitle, 'Elige el Esbirro a mostrar');
        assert.deepEqual(removed, {
            place: PLACE_ENCOUNTER_DISCARD,
            card: otherCard,
        });
        assert.deepEqual(revealed, [otherCard]);
    });

    test('SearchCardAndRevealEffect removes searched cards from their selected places', () => {
        const encounterDeckCards = [];
        const encounterDiscard = [];
        const nemesis = [];
        const scenarioAside = [];
        const match = {
            removeCardFromEncountersDeck(card) {
                encounterDeckCards.push(card);
            },
            scenario: {
                apart: scenarioAside,
                deck: {
                    searchDiscard(card) {
                        const index = encounterDiscard.indexOf(card);
                        if (index > -1) {
                            encounterDiscard.splice(index, 1);
                        }
                    },
                },
            },
        };
        const player = {superhero: {nemesis}};
        const deckCard = {id: 'deck-card'};
        const discardCard = {id: 'discard-card'};
        const nemesisCard = {id: 'nemesis-card'};
        const asideCard = {id: 'aside-card'};
        const effect = new SearchCardAndRevealEffect({
            match,
            places: [],
        });

        encounterDiscard.push(discardCard);
        nemesis.push(nemesisCard);
        scenarioAside.push(nemesisCard);
        scenarioAside.push(asideCard);

        effect.removeRevealed(PLACE_ENCOUNTER_DECK_CARDS, [deckCard], player);
        effect.removeRevealed(PLACE_ENCOUNTER_DISCARD, [discardCard], player);
        effect.removeRevealed(PLACE_OUTSIDE_NEMESIS, [nemesisCard], player);
        effect.removeRevealed(PLACE_ASIDE_MATCH, [asideCard], player);

        assert.deepEqual(encounterDeckCards, [deckCard]);
        assert.deepEqual(encounterDiscard, []);
        assert.deepEqual(nemesis, []);
        assert.deepEqual(scenarioAside, []);
        assert.throws(
            () => effect.removeRevealed('unsupported-place', [], player),
            /Unsupported card search place/
        );
    });

    test('a unique nemesis minion discarded from set-aside enters the game without surging Shadow of the Past', async () => {
        const encounterDiscard = [];
        const discardedFromGameZone = [];
        const faceDownEncounters = [
            {id: 'facedown-encounter'},
            {id: 'facedown-aside-encounter'},
        ];
        const [faceDownEncounter, faceDownAsideEncounter] = faceDownEncounters;
        const existingMinion = {name: 'Nemesis', unique: true};
        const scenario = {
            apart: [],
            deck: {
                cards: [],
                discardPile: encounterDiscard,
                async discard(card) {
                    encounterDiscard.push(card);
                },
            },
            gameZone: {
                currentScheme: undefined,
                cards: [],
                discard(card) {
                    discardedFromGameZone.push(card);
                },
            },
        };
        const createNemesisMinion = id => ({
            id,
            name: existingMinion.name,
            unique: true,
            isEncounterCard: true,
            isMain: false,
            isMinion: true,
            isSideScheme: false,
            isTreachery: false,
            isVillain: false,
            toObj() {
                return {id: this.id};
            },
            async discard() {
                scenario.gameZone.discard(this);
                await scenario.deck.discard(this);
            },
        });
        const nemesisMinion = createNemesisMinion('nemesis-minion');
        const asideMinion = createNemesisMinion('aside-minion');
        const player = {
            isPlayer: true,
            superhero: {nemesis: []},
            gameZone: {
                encounters: [],
                dealEncounterCard(cards) {
                    this.encounters.push(...cards);
                },
                async refresh() {},
            },
        };
        const match = {
            triggerCards: {},
            scenario,
            async openDialog() {},
            async drawEncounterCards() {
                return [faceDownEncounters.shift()];
            },
            isUniqueCard(card) {
                return card.unique && card.name === existingMinion.name;
            },
        };
        player.match = match;

        player.superhero.nemesis.push(nemesisMinion);
        const searchEffect = new SearchCardAndRevealEffect({
            match,
            places: [PLACE_OUTSIDE_NEMESIS],
            revealAll: true,
        });
        searchEffect.search = () => [nemesisMinion];

        await searchEffect.execute({player});

        assert.deepEqual(player.superhero.nemesis, []);
        assert.deepEqual(discardedFromGameZone, [nemesisMinion]);
        assert.deepEqual(encounterDiscard, [nemesisMinion]);
        assert.deepEqual(player.gameZone.encounters, [faceDownEncounter]);
        assert.equal(searchEffect.hasEnteredGame, true);
        assert.equal(searchEffect.isFullResolved(), true);

        scenario.apart.push(asideMinion);
        const asideSearchEffect = new SearchCardAndRevealEffect({
            match,
            places: [PLACE_ASIDE_MATCH],
            revealAll: true,
        });
        asideSearchEffect.search = () => [asideMinion];
        await asideSearchEffect.execute({player});

        assert.deepEqual(scenario.apart, []);
        assert.deepEqual(discardedFromGameZone, [nemesisMinion, asideMinion]);
        assert.deepEqual(encounterDiscard, [nemesisMinion, asideMinion]);
        assert.deepEqual(player.gameZone.encounters, [
            faceDownEncounter,
            faceDownAsideEncounter,
        ]);
        assert.equal(asideSearchEffect.hasEnteredGame, true);

        const shadowCard = standard.config.cards
            .find(({card}) => card.params.name === 'Una sombra del pasado').card;
        const surgeCondition = shadowCard.params.abilities[0].params.effect
            .params.effects.at(-1).params.condition;
        let surgeCount = 0;
        const surgeIfNoNemesisMinion = new DoIfEffect({
            condition: surgeCondition,
            effect: {
                async canRun() {
                    return true;
                },
                async runEffect() {
                    surgeCount++;
                },
            },
            match,
        });

        await surgeIfNoNemesisMinion.execute({effects: [searchEffect], player});
        assert.equal(surgeCount, 0);

        const laterSearchEffect = new SearchCardAndRevealEffect({
            match,
            places: [PLACE_OUTSIDE_NEMESIS],
            revealAll: true,
        });
        laterSearchEffect.search = () => [];
        await laterSearchEffect.execute({player});
        await surgeIfNoNemesisMinion.execute({
            effects: [laterSearchEffect],
            player,
        });

        assert.equal(laterSearchEffect.hasEnteredGame, false);
        assert.equal(surgeCount, 1);
    });
});
