import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};

const {McScenario} = await import(
    '../src/components/match/mc-scenario/mc-scenario.js'
);
const {McCharacterCard} = await import(
    '../src/components/cards/characters/mc-character-card/mc-character-card.js'
);
const {VillainCardComponent} = await import(
    '../src/components/cards/characters/mc-villain-card/mc-villain-card.js'
);
const {MainSchemeCardComponent} = await import(
    '../src/components/cards/schemes/mc-main-scheme-card/mc-main-scheme-card.js'
);
const {SchemeCardComponent} = await import(
    '../src/components/cards/schemes/mc-scheme-card/mc-scheme-card.js'
);

const assertUnprintedStatsForwarded = (template, unprintedStats) => {
    assert.match(template.strings.join(''), /\.unprintedStats=/);
    assert.ok(template.values.includes(unprintedStats));
};

describe('Scenario component', () => {
    test('scenario environments render their generic counters', () => {
        const environment = {isEnvironment: true};
        const sideScheme = {isSideScheme: true};
        const template = McScenario.prototype.renderEnvironments.call({
            scenario: {
                gameZone: {
                    cards: [environment, sideScheme],
                },
            },
            renderExtraDecks: () => '',
        });

        assert.deepEqual(template.values[0], [environment]);
        assert.match(template.strings.join(''), /show-generic/);
    });

    test('scenario auxiliary decks render in the environment area without discard piles', () => {
        const deck = {
            cards: [{id: 'weapon'}],
            hasDiscard: false,
            name: 'Armas experimentales',
        };
        const component = Object.assign(Object.create(McScenario.prototype), {
            scenario: {
                extraDecks: {'experimental-weapons': deck},
                gameZone: {cards: [{isEnvironment: true}]},
            },
            player: null,
            dragActivation: null,
        });
        const schemesTemplate = component.renderSchemes();
        const template = component.renderEnvironments();
        const extraDecksTemplate = template.values.find(value =>
            value?.strings?.join('').includes('class="extra-decks"')
        );

        assert.doesNotMatch(schemesTemplate.strings.join(''), /extra-decks/);
        assert.match(template.strings.join(''), /class="environments"/);
        assert.ok(extraDecksTemplate);
        const deckTemplate = extraDecksTemplate.values[0][0];
        const getBoundProperty = property => {
            const index = deckTemplate.strings.findIndex(part =>
                part.includes(`.${property}=`));

            return deckTemplate.values[index];
        };

        assert.equal(getBoundProperty('deckName'), 'Armas experimentales');
        assert.equal(getBoundProperty('deckNameSpansPiles'), true);
        assert.equal(getBoundProperty('showDiscard'), false);
        assert.match(deckTemplate.strings.join(''), /deck-name-position="top"/);
    });

    test('main scheme attachments reach the shared card renderer', () => {
        const attached = [{id: 'under-surveillance', name: 'Bajo vigilancia'}];
        const scheme = {
            name: 'Test main scheme',
            image: 'main-scheme.png',
            counters: 3,
            attached,
        };
        const scenarioTemplate = McScenario.prototype.renderMainScheme.call({
            scenario: {mainScheme: scheme},
            player: null,
            dragActivation: null,
        });
        const mainSchemeTemplate = MainSchemeCardComponent.prototype.render.call({
            card: scheme,
            attached,
            basicActivation: null,
            dragActivation: null,
            clickDisabled: false,
            menuOptions: [],
            name: scheme.name,
            image: scheme.image,
            threat: 0,
            acceleration: 0,
            counters: scheme.counters,
            value: 0,
            stage: 1,
            handleCardClick() {},
        });
        const schemeTemplate = SchemeCardComponent.prototype.render.call({
            card: scheme,
            attached,
            basicActivation: null,
            dragActivation: null,
            clickDisabled: false,
            menuOptions: [],
            name: scheme.name,
            image: scheme.image,
            threat: 0,
            acceleration: 0,
            counters: scheme.counters,
            headerLeft: 0,
            headerRight: 1,
        });

        for (const template of [
            scenarioTemplate,
            mainSchemeTemplate,
            schemeTemplate,
        ]) {
            assert.match(template.strings.join(''), /\.attached=/);
            assert.ok(template.values.includes(attached));
        }

        assert.ok(scenarioTemplate.values.includes(scheme.counters));
        assert.ok(mainSchemeTemplate.values.includes(scheme.counters));
        assert.ok(schemeTemplate.values.includes(scheme.counters));
        assert.match(schemeTemplate.strings.join(''), /\.generic=/);
        assert.match(schemeTemplate.strings.join(''), /\.showGeneric=/);
    });

    test('scenario villains forward unprinted stats to the villain card', () => {
        const unprintedStats = ['attack'];
        const tuckedCards = [{id: 'tucked-card'}];
        const villain = {
            name: 'Norman Osborn',
            image: 'norman-osborn.png',
            life: 14,
            attack: 0,
            scheme: 2,
            unprintedStats,
            tuckedCards,
        };
        const template = McScenario.prototype.renderVillain.call({
            scenario: {villain},
        });

        assertUnprintedStatsForwarded(template, unprintedStats);
        assert.ok(template.values.includes(tuckedCards));
    });

    test('villain card wrappers forward unprinted stats to the card renderer', () => {
        const unprintedStats = ['attack'];
        const villainCard = Object.assign(
            Object.create(VillainCardComponent.prototype),
            {
                name: 'Norman Osborn',
                image: 'norman-osborn.png',
                life: 14,
                hitPoints: 14,
                attack: 0,
                thwart: undefined,
                defense: undefined,
                recovery: undefined,
                scheme: 2,
                unprintedStats,
                stage: 1,
                attached: [],
                faceDown: [],
                statusCards: {},
                extraTraits: [],
                extraKeywords: [],
            }
        );
        const villainTemplate = villainCard.render();
        const characterTemplate = McCharacterCard.prototype.render.call({
            name: 'Norman Osborn',
            image: 'norman-osborn.png',
            isFacedownCard: false,
            life: 14,
            hitPoints: 14,
            attack: 0,
            thwart: undefined,
            defense: undefined,
            recovery: undefined,
            scheme: 2,
            unprintedStats,
            statusCards: {},
            attached: [],
            faceDown: [],
            extraTraits: [],
            extraKeywords: [],
            headerLeft: undefined,
            headerRight: undefined,
            stage: 1,
            nameWithStage: true,
        });

        assertUnprintedStatsForwarded(villainTemplate, unprintedStats);
        assertUnprintedStatsForwarded(characterTemplate, unprintedStats);
    });
});
