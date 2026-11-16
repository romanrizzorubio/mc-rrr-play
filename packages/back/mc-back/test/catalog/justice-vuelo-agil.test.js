import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CARD_TYPE_EVENT,
    CLASSIFICATION_JUSTICE,
    DIALOG_ASSIGN,
    EFFECT_ASSIGN_THREAT,
    LABEL_THWART,
    RESOURCE_MENTAL,
    TARGET_ALL_SCHEMES,
    TRAIT_AERIAL,
    TRAIT_THWART,
} from 'mc-shared';
import {MongoDataStore} from '../../../mc-data/index.js';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {AssignThreatEffect} from '../../src/effects/assign-threat-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerCard} from '../../src/model/printed/player-card.js';

describe('Vuelo ágil', () => {
    test('is available in the deck editor and absent from every precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const entry = aspects.find(({_id}) => _id === 'justice-vuelo-agil');

        assert.ok(entry);
        assert.equal(entry.aspect, CLASSIFICATION_JUSTICE);
        assert.equal(entry.order, 17029);
        assert.equal(entry.card.type, CARD_TYPE_EVENT);
        assert.equal(entry.card.params.name, 'Vuelo ágil');
        assert.equal(
            entry.card.params.image,
            'aspect/justice/events/17029.png'
        );
        assert.deepEqual(entry.card.params.traits, [
            TRAIT_AERIAL,
            TRAIT_THWART,
        ]);
        assert.equal(entry.card.params.cost, 3);
        assert.deepEqual(entry.card.params.resources, [RESOURCE_MENTAL]);
        assert.equal(
            entry.card.params.classification,
            CLASSIFICATION_JUSTICE
        );

        const preconIds = heroes.flatMap(({config}) =>
            (config.precon ?? []).flatMap(({cardRefs = []}) =>
                cardRefs.map(({id}) => id)
            )
        );
        assert.equal(preconIds.includes(entry._id), false);

        const hero = heroes.find(({_id}) => _id === 'spiderwoman');
        const store = new MongoDataStore();
        store.database = {
            collection(name) {
                return {
                    findOne: async () => name === 'heroes' ? hero : null,
                    find: () => ({
                        sort() {
                            return this;
                        },
                        toArray: async () => aspects,
                    }),
                };
            },
        };
        const deckEditorCatalog = await store.getDeckEditorCatalog('spiderwoman');

        assert.ok(deckEditorCatalog.cards.some(({id, name}) =>
            id === entry._id && name === 'Vuelo ágil'));
    });

    test('requires an Aerial superhero and configures a labeled Hero thwart', async () => {
        const {aspects, heroes} = await loadCatalog();
        const entry = aspects.find(({_id}) => _id === 'justice-vuelo-agil');
        const superheroConfig = heroes.find(({_id}) =>
            _id === 'ms-marvel').config;
        const superhero = new MatchFactory(
            new Match({name: 'vuelo-agil-playability'})
        ).createSuperhero({
            ...superheroConfig,
            cards: [],
            precon: [],
            nemesis: [],
        });
        superhero.selectedSide = 1;

        const card = new PlayerCard(entry.card.params);
        const player = {superhero};
        assert.deepEqual(card.paramsToPlay, {
            'superhero.traits': TRAIT_AERIAL,
        });
        assert.equal(await card.canPlay({player}), false);

        superhero.extraTraits.push(TRAIT_AERIAL);
        assert.equal(await card.canPlay({player}), true);

        const [ability] = entry.card.params.abilities;
        assert.equal(ability.type, ABILITY_HERO_ACTION);
        assert.deepEqual(ability.params.labels, [LABEL_THWART]);
        assert.deepEqual(ability.params.effect, {
            type: EFFECT_ASSIGN_THREAT,
            params: {
                target: TARGET_ALL_SCHEMES,
                threat: 5,
            },
        });
    });

    test('removes up to five threat assigned across the selected schemes', async () => {
        const {aspects} = await loadCatalog();
        const entry = aspects.find(({_id}) => _id === 'justice-vuelo-agil');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'vuelo-agil-threat-assignment',
        });
        const matchFactory = new MatchFactory(match);
        const player = {
            hand: {cards: []},
            isHero: true,
            isPlayer: true,
            match,
        };
        let assignmentDialog;
        const createScheme = (id, threat) => ({
            id,
            isCard: true,
            isScheme: true,
            isSideScheme: true,
            name: id,
            threat,
            canRemoveThreat() {
                return this.threat > 0;
            },
            canThwart(targetPlayer) {
                return this.canRemoveThreat() && targetPlayer.isHero;
            },
            removeThreat(amount) {
                this.threat = Math.max(0, this.threat - amount);
            },
            async refresh() {},
            toObj() {
                return {id: this.id, name: this.name, threat: this.threat};
            },
        });
        const firstScheme = createScheme('first-scheme', 3);
        const secondScheme = createScheme('second-scheme', 5);
        const emptyScheme = createScheme('empty-scheme', 0);
        match.scenario = {
            schemes: [firstScheme, secondScheme, emptyScheme],
        };
        match.openDialog = async dialog => {
            assignmentDialog = dialog;

            return {
                assigned: {
                    [firstScheme.id]: 3,
                    [secondScheme.id]: 2,
                },
            };
        };

        const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(
            entry.card,
            {owner: player}
        );
        const [ability] = gameCard.abilities;
        const effect = ability.effect;

        assert.ok(effect instanceof AssignThreatEffect);
        assert.equal(effect.effectType, EFFECT_ASSIGN_THREAT);
        assert.equal(typeof effect.canRun, 'function');
        assert.equal(await effect.canRun({card: gameCard, match, player}), true);

        await effect.runEffect({card: gameCard, match, player});

        assert.equal(assignmentDialog.dialogType, DIALOG_ASSIGN);
        assert.equal(assignmentDialog.data.count, 5);
        assert.deepEqual(
            assignmentDialog.data.cards.map(({id}) => id),
            [firstScheme.id, secondScheme.id]
        );
        assert.deepEqual(
            [firstScheme.threat, secondScheme.threat, emptyScheme.threat],
            [0, 3, 0]
        );
    });
});
