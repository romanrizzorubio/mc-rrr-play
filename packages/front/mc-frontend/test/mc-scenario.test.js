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
const scenarioStyles = (await import(
    '../src/components/match/mc-scenario/mc-scenarios.css.js'
)).default;
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
    test('renders the environment area between schemes and villain when occupied', () => {
        const zone = {cards: [{isEnvironment: true}]};
        const component = Object.assign(Object.create(McScenario.prototype), {
            scenario: {zones: [zone]},
            renderDeck: () => 'encounter deck',
            renderSchemes: () => 'main and side schemes',
            renderEnvironments: () => 'environments',
            renderVillain: () => 'villain',
        });

        const template = component.render();
        const scenarioTemplate = template.values[1];

        assert.equal(template.values[0], '');
        assert.equal(
            scenarioTemplate.values[0],
            'scenario-board has-environment-area'
        );
        assert.deepEqual(scenarioTemplate.values, [
            'scenario-board has-environment-area',
            'encounter deck',
            'main and side schemes',
            'environments',
            'villain',
        ]);
    });

    test('centers the main scheme when no environment area is occupied', () => {
        const zone = {cards: []};
        const component = Object.assign(Object.create(McScenario.prototype), {
            scenario: {zones: [zone]},
            renderDeck: () => 'encounter deck',
            renderSchemes: () => 'main and side schemes',
            renderEnvironments: () => '',
            renderVillain: () => 'villain',
        });

        const template = component.render();
        const scenarioTemplate = template.values[1];

        assert.equal(scenarioTemplate.values[0], 'scenario-board');
        assert.deepEqual(scenarioTemplate.values.slice(1), [
            'encounter deck',
            'main and side schemes',
            '',
            'villain',
        ]);
    });

    test('centers environments between the main scheme and villain', () => {
        assert.match(
            scenarioStyles.cssText,
            /\.scenario-board,\s*\.scenario-zone-cards/
        );
        assert.ok(scenarioStyles.cssText.includes(
            'grid-template-columns: auto repeat(3, minmax(0, 1fr))'
        ));
        assert.ok(scenarioStyles.cssText.includes(
            'grid-template-columns: auto minmax(0, 1fr) auto'
        ));
        assert.ok(scenarioStyles.cssText.includes(
            'grid-template-columns: repeat(3, minmax(0, 1fr))'
        ));
        assert.ok(scenarioStyles.cssText.includes(
            'grid-template-columns: minmax(0, 1fr) auto'
        ));
    });

    test('groups split-zone cards horizontally beneath their player label', () => {
        const zones = [
            {id: 'zone-1', players: ['Hulka'], cards: [{isEnvironment: true}]},
            {
                id: 'zone-2',
                players: ['Mapache Cohete'],
                cards: [{isEnvironment: true}],
            },
        ];
        const component = Object.assign(Object.create(McScenario.prototype), {
            scenario: {extraDecks: {}, zones},
            renderSchemes: () => 'schemes',
            renderEnvironments: () => 'environments',
            renderVillain: () => 'villain',
        });

        const template = component.renderZones(zones);
        const zoneTemplates = template.values[0];

        assert.match(template.strings.join(''), /class="scenario-zones"/);
        assert.equal(zoneTemplates.length, 2);
        for (const zoneTemplate of zoneTemplates) {
            assert.match(
                zoneTemplate.values[0].strings.join(''),
                /class="zone-players"/
            );
            assert.equal(
                zoneTemplate.values[1],
                'scenario-zone-cards has-environment-area'
            );
            assert.deepEqual(zoneTemplate.values.slice(2), [
                'schemes',
                'environments',
                'villain',
            ]);
        }
    });

    test('centers the scheme in split zones without an environment area', () => {
        const zone = {id: 'zone-1', players: ['Hulka'], cards: []};
        const component = Object.assign(Object.create(McScenario.prototype), {
            scenario: {extraDecks: {}, zones: [zone]},
            renderSchemes: () => 'schemes',
            renderEnvironments: () => '',
            renderVillain: () => 'villain',
        });

        const zoneTemplate = component.renderZones([zone]).values[0][0];

        assert.equal(zoneTemplate.values[1], 'scenario-zone-cards');
        assert.deepEqual(zoneTemplate.values.slice(2), [
            'schemes',
            '',
            'villain',
        ]);
    });

    test('highlights playable side schemes in the scenario card list', () => {
        const sideScheme = {id: 'under-fire', isSideScheme: true, playable: true};
        const zone = {
            cards: [
                sideScheme,
                {id: 'environment', isEnvironment: true, playable: true},
            ],
        };
        const component = Object.assign(Object.create(McScenario.prototype), {
            player: null,
            dragActivation: null,
            dragPlayCard: null,
            dragResourcePayment: null,
            renderMainScheme: () => 'main scheme',
        });
        const template = component.renderSchemes(zone);

        assert.match(template.strings.join(''), /highlight-playable/);
        assert.deepEqual(template.values[1], [sideScheme]);
    });

    test('shows the general zone and only the selected player scenario zone', () => {
        const generalZone = {id: 'zone-1', players: []};
        const selectedZone = {id: 'zone-2', players: ['Mapache Cohete']};
        const hiddenZone = {id: 'zone-3', players: ['Hulka']};
        const zones = [generalZone, selectedZone, hiddenZone];
        const component = Object.assign(Object.create(McScenario.prototype), {
            scenario: {
                gameZone: generalZone,
                zones,
            },
            player: {
                name: 'Mapache Cohete',
                scenarioZoneId: selectedZone.id,
            },
            renderDeck: () => 'encounter deck',
            renderZones: visibleZones => visibleZones,
        });

        const template = component.render();

        assert.deepEqual(template.values[1], [generalZone, selectedZone]);
    });

    test('shows only the general zone when no player zone is selected', () => {
        const generalZone = {id: 'zone-1', players: []};
        const hiddenZone = {id: 'zone-2', players: ['Hulka']};
        const renderedZones = [];
        const renderZone = zone => {
            renderedZones.push(zone);

            return '';
        };
        const component = Object.assign(Object.create(McScenario.prototype), {
            scenario: {
                gameZone: generalZone,
                zones: [generalZone, hiddenZone],
            },
            player: null,
            renderDeck: () => 'encounter deck',
            renderSchemes: renderZone,
            renderEnvironments: renderZone,
            renderVillain: renderZone,
        });

        component.render();

        assert.deepEqual(renderedZones, [
            generalZone,
            generalZone,
            generalZone,
        ]);
    });

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

    test('highlights a playable main scheme and labels its action menu option', () => {
        const actionName =
            'Agota la Milano para quitar 3 de amenaza de este plan';
        const card = {
            id: 'under-fire',
            name: 'A cañonazos',
            image: 'under-fire.png',
            playable: true,
            abilities: [{
                isAction: true,
                name: actionName,
                disable: false,
                availableTargetIds: ['under-fire'],
            }],
        };
        const mainScheme = Object.assign(
            Object.create(MainSchemeCardComponent.prototype),
            {
                card,
                player: null,
                attached: [],
                dragActivation: null,
                dragPlayCard: null,
                dragResourcePayment: null,
                name: card.name,
                image: card.image,
                acceleration: 0,
                threat: 0,
                counters: undefined,
                value: 0,
                stage: 1,
            }
        );
        const options = mainScheme.menuOptions;
        const schemeTemplate = SchemeCardComponent.prototype.render.call({
            card,
            attached: [],
            basicActivation: null,
            dragActivation: null,
            dragPlayCard: null,
            dragResourcePayment: null,
            clickDisabled: false,
            menuOptions: options,
            name: card.name,
            image: card.image,
            threat: 0,
            acceleration: 0,
            counters: undefined,
            headerLeft: 0,
            headerRight: 1,
        });

        assert.equal(options[0].text, actionName);
        assert.ok(schemeTemplate.values.includes('playable'));
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
