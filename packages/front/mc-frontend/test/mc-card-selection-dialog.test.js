import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
    mcStaticRemote: {
        getAssetUrl(path) {
            return path;
        },
    },
};
globalThis.CustomEvent = class {
    constructor(type, options = {}) {
        this.type = type;
        Object.assign(this, options);
    }
};

const {CardComponent} = await import(
    '../src/components/cards/mc-card/mc-card.js'
);
const {HandComponent: McCardList} = await import(
    '../src/components/cards/mc-card-list/mc-card-list.js'
);
const {McSelectTargetDialog} = await import(
    '../src/components/dialog/mc-select-target-dialog/mc-select-target-dialog.js'
);
const {McListDialog} = await import(
    '../src/components/dialog/mc-list-dialog/mc-list-dialog.js'
);
const {McDefenseDialog} = await import(
    '../src/components/dialog/mc-defense-dialog/mc-defense-dialog.js'
);
const {McDefense} = await import(
    '../src/components/panels/mc-defense/mc-defense.js'
);

describe('card selection dialogs', () => {
    test('a defense dialog sends a player request separately from selecting a defender card', () => {
        const player = {id: 'other-seat', name: 'Steve Rogers'};
        const responses = [];
        const dialog = Object.assign(Object.create(McDefenseDialog.prototype), {
            data: {attack: {target: {name: 'Carol Danvers'}}, defenders: [], players: [player]},
            hideOk: false, sendResponse() { responses.push(this._response); },
        });
        const template = dialog.renderContent();
        const bindingIndex = template.strings.findIndex(part => part.endsWith('.players="'));
        assert.deepEqual(template.values[bindingIndex], [player]);
        dialog.handleDefenseRequest({detail: {player}});
        dialog.handleDefenseSelect({detail: {card: {id: 'hero-card'}}});
        assert.deepEqual(responses, [
            {defendingPlayerId: 'other-seat'}, {defender: {id: 'hero-card'}},
        ]);
        assert.match(dialog.getTitle(), /Carol Danvers/u);
    });

    test('the defense panel offers selectable player portraits and dispatches the exact hero seat', () => {
        const player = {id: 'other-seat', name: 'Steve Rogers', image: 'hero.png'};
        const events = [];
        const panel = Object.assign(Object.create(McDefense.prototype), {
            players: [player], defenders: [], mustDefend: false,
            attack: {character: {attack: 5}, boostCards: []},
            dispatchEvent(event) { events.push(event); },
        });
        const template = panel.renderOtherPlayers();
        assert.match(template.strings.join(''), /Pedir a otro héroe que defienda/u);
        assert.match(template.strings.join(''), /<aside class="defense-requests"/u);
        const entry = template.values[0][0];
        assert.match(entry.strings.join(''), /<button[\s\S]*class="hero-thumbnail"/u);
        const bindingIndex = entry.strings.findIndex(part => part.endsWith('@click="'));
        let stopped = false;
        entry.values[bindingIndex]({stopPropagation() { stopped = true; }});
        assert.equal(stopped, true);
        assert.equal(events[0].type, 'request-defense');
        assert.deepEqual(events[0].detail, {player});
        const layout = panel.render();
        assert.equal(layout.values[0], 'with-requests');
        assert.match(layout.strings.join(''), /class="defense-main"/u);
        assert.match(McDefense.styles.cssText, /\.defense-layout\.with-requests\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) 220px;/u);
        assert.match(McDefense.styles.cssText, /\.hero-thumbnail\s*\{[^}]*width:\s*42px;[^}]*height:\s*58px;/u);
        panel.players = [];
        assert.equal(panel.renderOtherPlayers().strings.join(''), '');
        assert.equal(panel.render().values[0], '');
    });

    test('the responsible hero follows the title inside the dialog with a compact gap', () => {
        const renderText = value => {
            if (Array.isArray(value)) {
                return value.map(renderText).join('');
            }
            if (value?.strings && value?.values) {
                return value.strings.reduce((text, part, index) =>
                    text + part + renderText(value.values[index]), '');
            }
            return typeof value === 'string' ? value : '';
        };
        const dialog = Object.assign(Object.create(McSelectTargetDialog.prototype), {
            title: 'Elige tu objetivo', subtitle: '', footer: '', hand: [],
            targetPlayerName: 'Carol Danvers', readOnly: false,
            data: {cards: []}, _marked: [],
        });
        const markup = renderText(dialog.renderDialog());
        assert.match(markup, /Elige tu objetivo[\s\S]*class="content"[\s\S]*Héroe responsable: Carol Danvers[\s\S]*<mc-card-list/u);
        assert.equal(markup.match(/Héroe responsable:/gu).length, 1);
        assert.match(McSelectTargetDialog.styles[0].cssText, /\.title\s*\{[^}]*margin:\s*0 0 8px;/u);
        assert.match(McSelectTargetDialog.styles[0].cssText, /\.dialog-responsible-player\s*\{[^}]*margin:\s*0 0 12px;/u);
        dialog.readOnly = true;
        assert.match(renderText(dialog.renderDialog()), /Carol Danvers[\s\S]*<div inert>/u);
        dialog.targetPlayerName = '';
        assert.doesNotMatch(renderText(dialog.renderDialog()), /dialog-responsible-player/u);
    });

    test('an action menu omits empty optional headings and hides its table button', () => {
        const renderTemplate = value => {
            if (Array.isArray(value)) {
                return value.map(renderTemplate).join('');
            }
            if (value?.strings && value?.values) {
                return value.strings.reduce((text, part, index) =>
                    text + part + renderTemplate(value.values[index]), '');
            }

            return typeof value === 'string' ? value : '';
        };
        const dialog = Object.assign(Object.create(McListDialog.prototype), {
            data: {options: [], card: {}, showCounters: false},
            title: '', subtitle: '', footer: '', hand: [], readOnly: false,
            hideViewTable: true,
            hideResponsiblePlayer: true,
            targetPlayerName: 'Carol Danvers',
        });
        let markup = renderTemplate(dialog.renderDialog());
        assert.doesNotMatch(markup, /<h[23]\b[^>]*>\s*<\/h[23]>/u);
        assert.doesNotMatch(markup, /Ver mesa/u);
        assert.doesNotMatch(markup, /Héroe responsable/u);
        dialog.hideViewTable = false;
        dialog.hideResponsiblePlayer = false;
        markup = renderTemplate(dialog.renderDialog());
        assert.match(markup, /Ver mesa/u);
        assert.match(markup, /Héroe responsable: Carol Danvers/u);
        dialog.title = 'Elige una capacidad';
        dialog.subtitle = 'Selecciona una opción';
        dialog.footer = 'Información';
        markup = renderTemplate(dialog.renderDialog());
        assert.match(markup, /<h2 class="title">[\s\S]*Elige una capacidad/u);
        assert.match(markup, /<h3 class="subtitle">[\s\S]*Selecciona una opción/u);
        assert.match(markup, /<h3 class="footer">[\s\S]*Información/u);
        dialog.title = '';
        dialog.hand = [{id: 'hand-card'}];
        markup = renderTemplate(dialog.renderDialog());
        assert.doesNotMatch(markup, /<h[23]\b[^>]*>\s*<\/h[23]>/u);
        dialog.readOnly = true;
        markup = renderTemplate(dialog.renderDialog());
        assert.doesNotMatch(markup, /<h[23]\b[^>]*>\s*<\/h[23]>/u);
    });

    test('target selection dialog configures cards to select on click', () => {
        const dialog = Object.assign(
            Object.create(McSelectTargetDialog.prototype),
            {
                data: {
                    cards: [],
                    showCounters: true,
                    showLife: true,
                    showDamage: false,
                },
                _marked: [],
            }
        );
        const template = dialog.renderContent();
        const selectOnClickBinding = template.strings.findIndex(part =>
            part.includes('.selectOnClick="'));

        assert.notEqual(selectOnClickBinding, -1);
        assert.equal(template.values[selectOnClickBinding], true);
    });

    test('card list passes selection mode to its cards', () => {
        const cardList = Object.assign(
            Object.create(McCardList.prototype),
            {
                size: 'm',
                marked: [],
                disabledCards: [],
                showBasicStats: false,
                showAcquiredTraits: false,
                showMenuAbilities: false,
                showLife: false,
                showDamage: false,
                showThreat: false,
                showGeneric: false,
                emphasizedStats: [],
                showExhausted: false,
                highlightPlayable: false,
                rotatePlanCards: false,
                allowPlayCardDrag: false,
                selectOnClick: true,
                player: null,
                basicActivationType: '',
                dragActivation: null,
                dragPlayCard: null,
                dragResourcePayment: null,
            }
        );
        const template = cardList.renderCard({
            id: 'scheme-1',
            name: 'En el punto de mira',
            image: 'side-scheme.png',
            isSideScheme: true,
            tuckedCards: [{name: 'Pájaro Burlón'}],
        }, 0);
        const selectOnClickBinding = template.strings.findIndex(part =>
            part.includes('.selectOnClick="'));

        assert.notEqual(selectOnClickBinding, -1);
        assert.equal(template.values[selectOnClickBinding], true);
    });

    test('clicking a tucked host in selection mode selects the host', () => {
        const events = [];
        const host = {
            id: 'scheme-1',
            name: 'En el punto de mira',
            tuckedCards: [{name: 'Pájaro Burlón'}],
        };
        const card = Object.assign(Object.create(CardComponent.prototype), {
            basicActivation: undefined,
            card: host,
            clickDisabled: false,
            doubleClickOption: '',
            menuOptions: [],
            selectOnClick: true,
            tuckedCards: host.tuckedCards,
            dispatchEvent(event) {
                events.push(event);
            },
        });

        card.handleClick({detail: 1});

        assert.equal(events.length, 1);
        assert.equal(events[0].type, 'card-click');
        assert.deepEqual(events[0].detail, {card: host});
    });

    test('clicking a tucked host outside selection mode opens its tucked cards', () => {
        const events = [];
        const host = {
            id: 'scheme-1',
            name: 'En el punto de mira',
            tuckedCards: [{name: 'Pájaro Burlón'}],
        };
        const card = Object.assign(Object.create(CardComponent.prototype), {
            basicActivation: undefined,
            card: host,
            clickDisabled: false,
            doubleClickOption: '',
            menuOptions: [],
            selectOnClick: false,
            tuckedCards: host.tuckedCards,
            dispatchEvent(event) {
                events.push(event);
            },
            handleViewTuckedCards() {
                events.push({type: 'view-tucked-cards'});
            },
        });

        card.handleClick({detail: 1});

        assert.deepEqual(events, [{type: 'view-tucked-cards'}]);
    });
});
