import assert from 'node:assert/strict';
import {test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};
globalThis.CustomEvent = class {
    constructor(type, options) {
        this.type = type;
        Object.assign(this, options);
    }
};

const {McCreateMatch} = await import(
    '../src/components/views/mc-create-match/mc-create-match.js'
);

const createComponent = properties => Object.assign(
    Object.create(McCreateMatch.prototype),
    {
        name: 'Partida de prueba',
        currentStep: 1,
        expert: false,
        player: {
            name: 'Hulka',
            hero: 'she-hulk',
            deckId: 'deck-1',
        },
        scenario: {
            scenario: 'risky-business',
            modularSets: ['goblin-gimmicks'],
        },
        heroesList: [],
        decksList: [],
        loadingDecks: false,
        deckLoadError: '',
        scenariosList: [],
        modularSetsList: [],
        selectedModularSets: ['goblin-gimmicks'],
        ...properties,
    }
);

test('creation defaults the match and player names to RRR', () => {
    const component = new McCreateMatch();

    assert.equal(component.name, 'RRR');
    assert.equal(component.player.name, 'RRR');
});

const flattenTemplate = template => template.strings.reduce((markup, part, index) => {
    const value = template.values[index];
    const renderedValue = Array.isArray(value) ?
        value.map(item => item?.strings ? flattenTemplate(item) : '').join('') :
        value?.strings ?
            flattenTemplate(value) :
            typeof value === 'string' || typeof value === 'number' ?
                value :
                '';

    return `${markup}${part}${renderedValue}`;
}, '');

test('creation starts with the Match and Player view and advances only when valid', () => {
    const component = createComponent();
    const firstView = flattenTemplate(component.render());

    assert.match(firstView, /title="Partida"/);
    assert.match(firstView, /title="Jugador"/);
    assert.doesNotMatch(firstView, /Modo Experto/);
    assert.doesNotMatch(firstView, /title="Escenario"/);
    assert.match(firstView, /Continuar/);

    component.player = {};
    component.handleNext();
    assert.equal(component.currentStep, 1);

    component.player = {name: 'Hulka', hero: 'she-hulk'};
    component.handleNext();
    assert.equal(component.currentStep, 2);

    const secondView = flattenTemplate(component.render());
    assert.doesNotMatch(secondView, /title="Jugador"/);
    assert.match(secondView, /title="Escenario"/);
    assert.match(secondView, /Modo Experto/);
    assert.match(secondView, /title="Conjuntos modulares"/);
    assert.ok(
        secondView.indexOf('title="Escenario"') <
        secondView.indexOf('Modo Experto')
    );
    assert.ok(
        secondView.indexOf('Modo Experto') <
        secondView.indexOf('title="Conjuntos modulares"')
    );
    assert.match(secondView, /Crear partida/);
});

test('going back preserves selections and creation emits only from the valid second view', () => {
    const component = createComponent({currentStep: 2});
    const events = [];
    component.dispatchEvent = event => events.push(event);

    component.handleBack();
    assert.equal(component.currentStep, 1);
    assert.deepEqual(component.player, {
        name: 'Hulka',
        hero: 'she-hulk',
        deckId: 'deck-1',
    });
    assert.deepEqual(component.scenario, {
        scenario: 'risky-business',
        modularSets: ['goblin-gimmicks'],
    });

    component.currentStep = 1;
    component.handleClick();
    assert.equal(events.length, 0);

    component.currentStep = 2;
    component.handleExpertChange({target: {checked: true}});
    component.handleClick();

    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'create-match');
    assert.deepEqual(events[0].detail, {
        name: 'Partida de prueba',
        expert: true,
        player: {
            name: 'Hulka',
            hero: 'she-hulk',
            deckId: 'deck-1',
        },
        scenario: {
            scenario: 'risky-business',
            modularSets: ['goblin-gimmicks'],
        },
    });
});
