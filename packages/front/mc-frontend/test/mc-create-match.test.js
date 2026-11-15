import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

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
        maxPlayers: 4,
        currentStep: 1,
        expert: false,
        autoSave: true,
        scenario: {
            scenario: 'risky-business',
            modularSets: ['goblin-gimmicks'],
        },
        scenariosList: [],
        modularSetsList: [],
        selectedModularSets: ['goblin-gimmicks'],
        ...properties,
    }
);

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

describe('match creation form', () => {
    test('starts with a four-hero limit and no player selection', () => {
        const component = new McCreateMatch();

        assert.equal(component.name, 'RRR');
        assert.equal(component.maxPlayers, 4);
        assert.equal(component.autoSave, true);
        assert.equal(Object.hasOwn(component, 'player'), false);
    });

    test('creation separates match and scenario into two steps without choosing heroes', () => {
        const component = createComponent();
        const firstView = flattenTemplate(component.render());

        assert.match(firstView, /Paso 1 de 2: Partida/u);
        assert.match(firstView, /title="Partida"/);
        assert.match(firstView, /Máximo de superhéroes/);
        assert.match(firstView, /<md-filled-select/u);
        assert.match(firstView, /value="4"/);
        assert.match(firstView, /Guardado automático/u);
        assert.doesNotMatch(firstView, /title="Héroe y aspecto"/u);
        assert.doesNotMatch(firstView, /<mc-deck-picker/u);
        assert.doesNotMatch(firstView, /Modo Experto/);
        assert.doesNotMatch(firstView, /title="Escenario"/);
        assert.match(firstView, /Continuar/);

        component.name = '';
        component.handleNext();
        assert.equal(component.currentStep, 1);

        component.name = 'Partida de prueba';
        component.handleNext();
        assert.equal(component.currentStep, 2);

        const secondView = flattenTemplate(component.render());
        assert.match(secondView, /Paso 2 de 2: Escenario y conjuntos modulares/u);
        assert.doesNotMatch(secondView, /<mc-form-player|<mc-deck-picker/u);
        assert.match(secondView, /title="Escenario"/u);
        assert.match(secondView, /Modo Experto/u);
        assert.match(secondView, /title="Conjuntos modulares"/u);
        assert.doesNotMatch(secondView, /Guardado automático/u);
        assert.match(secondView, /Crear partida/u);
        assert.doesNotMatch(secondView, /Continuar/u);
        component.handleNext();
        assert.equal(component.currentStep, 2);
        component.scenario = {};
        assert.equal(component.disabled, true);
    });

    test('max-player selector accepts only values from one to four', () => {
        const component = createComponent({maxPlayers: 4});

        component.handleMaxPlayersChange({target: {value: '2'}});
        assert.equal(component.maxPlayers, 2);

        component.handleMaxPlayersChange({target: {value: '5'}});
        assert.equal(component.maxPlayers, 2);

        component.handleMaxPlayersChange({target: {value: '1.5'}});
        assert.equal(component.maxPlayers, 2);
    });

    test('going back preserves scenario selection and creation emits only from step two', () => {
        const component = createComponent({currentStep: 2});
        const events = [];
        component.dispatchEvent = event => events.push(event);

        component.handleBack();
        assert.equal(component.currentStep, 1);
        assert.deepEqual(component.scenario, {
            scenario: 'risky-business',
            modularSets: ['goblin-gimmicks'],
        });

        component.currentStep = 1;
        component.handleClick();
        assert.equal(events.length, 0);

        component.currentStep = 2;
        const scenario = component.scenario;
        component.scenario = {};
        component.handleClick();
        assert.equal(events.length, 0);
        component.scenario = scenario;
        component.handleExpertChange({target: {checked: true}});
        component.handleAutoSaveChange({target: {checked: false}});
        component.handleClick();

        assert.equal(events.length, 1);
        assert.equal(events[0].type, 'create-match');
        assert.deepEqual(events[0].detail, {
            name: 'Partida de prueba',
            maxPlayers: 4,
            expert: true,
            autoSave: false,
            scenario: {
                scenario: 'risky-business',
                modularSets: ['goblin-gimmicks'],
            },
        });
    });

    test('required scenario sets are displayed but cannot be removed as modular sets', () => {
        const component = createComponent({
            scenario: {},
            scenariosList: [{
                folder: 'crossbones',
                requiredSets: [
                    {id: 'standard', name: 'standard'},
                    {id: 'experimental-weapons', name: 'Armas experimentales'},
                ],
                defaultModularSets: ['hydra-assault'],
            }],
            modularSetsList: [
                {id: 'experimental-weapons', name: 'Armas experimentales'},
                {id: 'hydra-assault', name: 'Asalto de Hydra'},
                {id: 'goblin-gimmicks', name: 'Artilugios de Duende'},
            ],
            selectedModularSets: [],
        });

        component.handleScenarioChanged({detail: {scenario: 'crossbones'}});

        assert.deepEqual(component.selectedModularSets, ['hydra-assault']);
        assert.deepEqual(
            component.requiredSets.map(({id}) => id),
            ['standard', 'experimental-weapons']
        );
        assert.deepEqual(component.requiredSetNames, [
            'Normal',
            'Armas experimentales',
        ]);
        assert.deepEqual(
            component.availableModularSets.map(({id}) => id),
            ['goblin-gimmicks']
        );

        component.removeModularSet('experimental-weapons');
        component.addModularSet('experimental-weapons');
        assert.deepEqual(component.selectedModularSets, ['hydra-assault']);

        const markup = flattenTemplate(component.renderModularSets());
        assert.match(markup, /Normal, Armas experimentales/);
        assert.doesNotMatch(markup, /Obligatorio<\/span>/);
        assert.doesNotMatch(markup, /aria-label="Quitar Armas experimentales"/);
        assert.match(markup, /aria-label="Quitar Asalto de Hydra"/);
    });
});
