import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};
globalThis.CustomEvent ??= class {
    constructor(type, options = {}) {
        this.type = type;
        Object.assign(this, options);
    }
};

const {McScenario} = await import(
    '../src/components/match/mc-scenario/mc-scenario.js'
);
const scenarioStyles = (await import(
    '../src/components/match/mc-scenario/mc-scenarios.css.js'
)).default;
const cardStyles = (await import(
    '../src/components/cards/mc-card/mc-card.css.js'
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
    test('keeps the environment area inside the plans panel when occupied', () => {
        const zone = {cards: [{isEnvironment: true}]};
        const component = Object.assign(Object.create(McScenario.prototype), {
            scenario: {extraDecks: {}, zones: [zone]},
            renderMainScheme: () => 'main and side schemes',
            renderEnvironments: () => 'environments',
            renderDeck: () => 'encounter deck',
            renderVillain: () => 'villain',
        });

        const template = component.render();
        const scenarioTemplate = template.values[1];
        const encounterAreaTemplate = scenarioTemplate.values[0];
        const schemesTemplate = scenarioTemplate.values[1];

        assert.equal(template.values[0], '');
        assert.match(scenarioTemplate.strings.join(''), /class="scenario-board"/);
        assert.ok(encounterAreaTemplate.strings.join('').includes(
            'class="scenario-encounter-area"'
        ));
        assert.equal(encounterAreaTemplate.values[0], 'encounter deck');
        assert.equal(scenarioTemplate.values[2], 'villain');
        assert.match(
            schemesTemplate.values[0],
            /^schemes has-environment-area$/
        );
        assert.ok(schemesTemplate.values.includes('main and side schemes'));
        assert.ok(schemesTemplate.values.includes('environments'));
    });

    test('centers the main scheme when no environment area is occupied', () => {
        const zone = {cards: []};
        const component = Object.assign(Object.create(McScenario.prototype), {
            scenario: {extraDecks: {}, zones: [zone]},
            renderMainScheme: () => 'main and side schemes',
            renderEnvironments: () => '',
            renderDeck: () => 'encounter deck',
            renderVillain: () => 'villain',
        });

        const template = component.render();
        const scenarioTemplate = template.values[1];
        const encounterAreaTemplate = scenarioTemplate.values[0];
        const schemesTemplate = scenarioTemplate.values[1];

        assert.match(scenarioTemplate.strings.join(''), /class="scenario-board"/);
        assert.ok(encounterAreaTemplate.strings.join('').includes(
            'class="scenario-encounter-area"'
        ));
        assert.equal(encounterAreaTemplate.values[0], 'encounter deck');
        assert.equal(scenarioTemplate.values[2], 'villain');
        assert.equal(schemesTemplate.values[0], 'schemes');
    });

    test('keeps the board to three columns and environments within the plans panel', () => {
        assert.match(
            scenarioStyles.cssText,
            /\.scenario-board,\s*\.scenario-zone-cards/
        );
        assert.ok(scenarioStyles.cssText.includes(
            'grid-template-columns: auto minmax(0, 1fr) auto'
        ));
        assert.ok(scenarioStyles.cssText.includes(
            'grid-template-columns: minmax(0, 1fr) auto'
        ));
        assert.match(
            scenarioStyles.cssText,
            /\.schemes\.has-environment-area\s*\{\s*flex-direction: row;\s*justify-content: center;\s*align-items: flex-start;/
        );
        assert.equal(
            scenarioStyles.cssText.includes(
                'grid-template-columns: auto repeat(3, minmax(0, 1fr))'
            ),
            false
        );
    });

    test('shows the shared Victory Display beside the encounter deck and opens its view', () => {
        const cards = [{id: 'victory-card-1'}, {id: 'victory-card-2'}];
        let dispatchedEvent;
        const component = Object.assign(Object.create(McScenario.prototype), {
            scenario: {
                gameZone: {cards: []},
                extraDecks: {},
                additionalZones: {},
            },
            player: null,
            victoryDisplay: cards,
            renderDeck: () => 'encounter deck',
            dispatchEvent(event) {
                dispatchedEvent = event;
            },
        });
        const encounterAreaTemplate = component.renderEncounterArea();
        const victoryDisplayTemplate = encounterAreaTemplate.values[1];
        const clickHandlerIndex = victoryDisplayTemplate.strings.findIndex(part =>
            part.includes('@click='));

        assert.equal(encounterAreaTemplate.values[0], 'encounter deck');
        assert.ok(encounterAreaTemplate.strings.join('').includes(
            'class="scenario-encounter-area"'
        ));
        assert.equal(victoryDisplayTemplate.values[0], 'Zona de victoria (2)');
        assert.ok(victoryDisplayTemplate.strings.join('').includes(
            'class="victory-display-toggle"'
        ));
        assert.equal(
            component.renderSchemes().strings.join('').includes(
                'victory-display-toggle'
            ),
            false
        );
        assert.match(
            scenarioStyles.cssText,
            /\.victory-display-toggle\s*\{[^}]*border:\s*1px solid #000;[^}]*border-radius:\s*3px;[^}]*padding:\s*6px 10px;[^}]*background:\s*#fff;[^}]*color:\s*#000;[^}]*font-size:\s*1rem;/
        );
        victoryDisplayTemplate.values[clickHandlerIndex]();

        assert.equal(dispatchedEvent.type, 'view-victory-display');
        assert.equal(dispatchedEvent.bubbles, true);
        assert.equal(dispatchedEvent.composed, true);
    });

    test('hides the shared Victory Display label when it is empty', () => {
        const component = Object.assign(Object.create(McScenario.prototype), {
            victoryDisplay: [],
        });

        assert.equal(component.renderVictoryDisplay(), '');
    });

    test('styles additional-zone titles like main scheme titles', () => {
        assert.match(
            scenarioStyles.cssText,
            /\.additional-zone-toggle\s*\{[^}]*font-family:\s*var\(--mc-font-title,\s*sans-serif\);/
        );
        assert.match(
            scenarioStyles.cssText,
            /\.additional-zone-toggle\s*\{[^}]*font-size:\s*0\.85rem;[^}]*font-weight:\s*700;[^}]*line-height:\s*1\.1;/
        );
    });

    test('places main-scheme attachments before the environment with extra spacing', () => {
        assert.match(
            cardStyles.cssText,
            /:host\(\[horizontal\]\[has-attached\]\)\s*\{\s*width:\s*max-content;/
        );
        assert.match(
            cardStyles.cssText,
            /:host\(\[horizontal\]\[has-attached\]\)\s+header\s*\{\s*width:\s*calc\(var\(--card-size\)\s*\*\s*1\.39667\);/
        );
        assert.match(
            scenarioStyles.cssText,
            /\.schemes\.has-environment-area\s*\{[^}]*gap:\s*24px;/
        );
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
        const environmentCalls = [];
        const component = Object.assign(Object.create(McScenario.prototype), {
            scenario: {extraDecks: {}, zones},
            renderMainScheme: () => 'main scheme',
            renderEnvironments: (zone, includeExtraDecks) => {
                environmentCalls.push([zone.id, includeExtraDecks]);

                return `${zone.id} environments`;
            },
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
            assert.match(
                zoneTemplate.strings.join(''),
                /class="scenario-zone-cards"/
            );
            assert.equal(zoneTemplate.values[2], 'villain');
            assert.equal(
                zoneTemplate.values[1].values[0],
                'schemes has-environment-area'
            );
            assert.ok(zoneTemplate.values[1].values.some(value =>
                typeof value === 'string' && value.endsWith('environments')
            ));
        }
        assert.deepEqual(environmentCalls, [
            ['zone-1', true],
            ['zone-2', false],
        ]);
    });

    test('centers the scheme in split zones without an environment area', () => {
        const zone = {id: 'zone-1', players: ['Hulka'], cards: []};
        const component = Object.assign(Object.create(McScenario.prototype), {
            scenario: {extraDecks: {}, zones: [zone]},
            renderMainScheme: () => 'main scheme',
            renderEnvironments: () => '',
            renderVillain: () => 'villain',
        });

        const zoneTemplate = component.renderZones([zone]).values[0][0];
        const schemesTemplate = zoneTemplate.values[1];

        assert.match(
            zoneTemplate.strings.join(''),
            /class="scenario-zone-cards"/
        );
        assert.equal(zoneTemplate.values[2], 'villain');
        assert.equal(schemesTemplate.values[0], 'schemes');
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
        const cardsIndex = template.strings.findIndex(part =>
            part.includes('.cards='));

        assert.deepEqual(template.values[cardsIndex], [sideScheme]);
    });

    test('forwards a side-scheme menu selection to the match as an ability', () => {
        const card = {id: 'orbital-lockdown', isSideScheme: true};
        const component = Object.assign(Object.create(McScenario.prototype), {
            player: null,
            scenario: {extraDecks: {}},
            dragActivation: null,
            dragPlayCard: null,
            dragResourcePayment: null,
            renderMainScheme: () => 'main scheme',
        });
        const events = [];
        let propagationStopped = false;
        component.dispatchEvent = event => events.push(event);

        const template = component.renderSchemes({cards: [card]});
        const menuClickIndex = template.strings.findIndex(part =>
            part.includes('@card-list-menu-click='));

        assert.notEqual(menuClickIndex, -1);
        const handleMenuClick = template.values[menuClickIndex];
        assert.equal(typeof handleMenuClick, 'function');
        handleMenuClick({
            detail: {card, ability: 1},
            stopPropagation() {
                propagationStopped = true;
            },
        });

        assert.equal(propagationStopped, true);
        assert.equal(events.length, 1);
        assert.equal(events[0].type, 'ability');
        assert.deepEqual(events[0].detail, {card, ability: 1});
        assert.equal(events[0].bubbles, true);
        assert.equal(events[0].composed, true);
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

        assert.deepEqual(renderedZones, [generalZone, generalZone]);
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
        const environmentTemplate = schemesTemplate.values.find(value =>
            value?.strings?.join('').includes('class="environment-area"')
        );
        assert.ok(environmentTemplate);
        const extraDecksTemplate = environmentTemplate.values.find(value =>
            value?.strings?.join('').includes('class="extra-decks"')
        );

        assert.equal(schemesTemplate.values[0], 'schemes has-environment-area');
        assert.match(environmentTemplate.strings.join(''), /class="environments"/);
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

    test('additional zones render as small face-up decks in the environment area', () => {
        const topCard = {id: 'collected-card', image: 'card.png'};
        const zones = {
            collection: {
                id: 'collection',
                name: 'La Colección',
                cards: [topCard, {id: 'second-card'}],
            },
            empty: {
                id: 'empty',
                name: 'Zona vacía',
                cards: [],
            },
        };
        const component = Object.assign(Object.create(McScenario.prototype), {
            scenario: {
                additionalZones: zones,
                extraDecks: {},
                gameZone: {cards: []},
            },
            openAdditionalZones: new Set(),
            player: null,
            dragActivation: null,
            dragPlayCard: null,
            dragResourcePayment: null,
            renderMainScheme: () => 'main scheme',
        });
        const schemesTemplate = component.renderSchemes();
        const environmentTemplate = schemesTemplate.values.find(value =>
            value?.strings?.join('').includes('class="environment-area"')
        );
        const additionalZonesTemplate = environmentTemplate.values.find(value =>
            value?.strings?.join('').includes('class="additional-zones"')
        );
        const zoneTemplates = additionalZonesTemplate.values[0];

        assert.equal(schemesTemplate.values[0], 'schemes has-environment-area');
        assert.equal(zoneTemplates.length, 2);

        for (const [index, zoneTemplate] of zoneTemplates.entries()) {
            const getBoundProperty = property => {
                const propertyIndex = zoneTemplate.strings.findIndex(part =>
                    part.includes(`.${property}=`)
                );

                return zoneTemplate.values[propertyIndex];
            };
            const zone = Object.values(zones)[index];
            const titleIndex = zoneTemplate.strings.findIndex(part =>
                part.includes('@click=')
            ) + 1;
            const templateText = zoneTemplate.strings.join('');

            assert.equal(zoneTemplate.values[titleIndex], zone.name);
            assert.ok(templateText.indexOf('class="additional-zone-toggle"') <
                templateText.indexOf('<mc-deck'));
            assert.match(templateText, /size="s"/);
            assert.equal(getBoundProperty('cards'), zone.cards);
            assert.equal(getBoundProperty('topCard'), zone.cards[0]);
            assert.equal(getBoundProperty('topCardFaceUp'), true);
            assert.equal(getBoundProperty('deckName'), zone.name);
            assert.equal(getBoundProperty('showDeckName'), false);
            assert.equal(getBoundProperty('showDiscard'), false);
        }
    });

    test('shows scenario-wide additional zones only in the general split area', () => {
        const generalZone = {id: 'general', cards: []};
        const playerZone = {id: 'player', cards: []};
        const component = Object.assign(Object.create(McScenario.prototype), {
            scenario: {
                gameZone: generalZone,
                zones: [generalZone, playerZone],
                additionalZones: {
                    collection: {
                        id: 'collection',
                        name: 'La Colección',
                        cards: [],
                    },
                },
                extraDecks: {},
            },
            openAdditionalZones: new Set(),
            renderMainScheme: () => 'main scheme',
        });
        const generalSchemes = component.renderSchemes(generalZone, true);
        const playerSchemes = component.renderSchemes(playerZone, false);

        assert.equal(generalSchemes.values[0], 'schemes has-environment-area');
        assert.equal(playerSchemes.values[0], 'schemes');
        assert.equal(
            generalSchemes.values.some(value =>
                value?.strings?.join('').includes('class="environment-area"')
            ),
            true
        );
        assert.equal(
            playerSchemes.values.some(value =>
                value?.strings?.join('').includes('class="environment-area"')
            ),
            false
        );
    });

    test('places global scenario areas with the general zone regardless of order', () => {
        const generalZone = {id: 'general', cards: []};
        const playerZone = {id: 'player', cards: []};
        const zones = [playerZone, generalZone];
        const component = Object.assign(Object.create(McScenario.prototype), {
            scenario: {
                gameZone: generalZone,
                zones,
                additionalZones: {
                    collection: {
                        id: 'collection',
                        name: 'La Colección',
                        cards: [],
                    },
                },
                extraDecks: {},
            },
            openAdditionalZones: new Set(),
            renderMainScheme: () => 'main scheme',
            renderVillain: () => 'villain',
        });
        const zoneTemplates = component.renderZones(zones).values[0];

        assert.deepEqual(
            zoneTemplates.map(zoneTemplate => zoneTemplate.values[1].values[0]),
            ['schemes', 'schemes has-environment-area']
        );
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
            handleCardMenuClick() {},
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

        assert.match(schemeTemplate.strings.join(''), /\?has-attached=/);
        assert.ok(schemeTemplate.values.includes(true));
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
        const events = [];
        mainScheme.dispatchEvent = event => events.push(event);
        const schemeTemplate = SchemeCardComponent.prototype.render.call({
            card,
            attached: [],
            basicActivation: null,
            dragActivation: null,
            dragPlayCard: null,
            dragResourcePayment: null,
            clickDisabled: mainScheme.clickDisabled,
            menuOptions: options,
            name: card.name,
            image: card.image,
            threat: 0,
            acceleration: 0,
            counters: undefined,
            headerLeft: 0,
            headerRight: 1,
        });

        assert.equal(mainScheme.clickDisabled, false);
        assert.equal(options.length, 1);
        assert.equal(options[0].text, actionName);
        assert.ok(schemeTemplate.values.includes('playable'));
        mainScheme.handleCardMenuClick({
            detail: {option: options[0].id},
            stopPropagation() {},
        });
        assert.equal(events[0].type, 'ability');
        assert.deepEqual(events[0].detail, {card, ability: 0});
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
