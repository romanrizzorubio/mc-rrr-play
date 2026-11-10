import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};
globalThis.CustomEvent = class {
    constructor(type, options = {}) {
        this.type = type;
        Object.assign(this, options);
    }
};

const {
    MENU_OPTION_END,
    MENU_OPTION_REQUEST_PLAYER_ACTION,
    MENU_OPTION_VIEW_HAND,
    SuperheroCardComponent,
} = await import(
    '../src/components/cards/characters/mc-superhero-card/mc-superhero-card.js'
);
const {McPlayer} = await import(
    '../src/components/match/mc-player/mc-player.js'
);

describe('player card display', () => {
    test('hides the player name below their deck while keeping the deck name available', () => {
        const player = Object.assign(Object.create(McPlayer.prototype), {
            player: {
                name: 'Peter Parker',
                deck: {
                    cards: [],
                    discard: [],
                },
            },
            dragActivation: null,
        });
        const template = player.renderDeck();
        const deckNameBinding = template.strings.findIndex(part =>
            part.includes('.deckName='));
        const showDeckNameBinding = template.strings.findIndex(part =>
            part.includes('.showDeckName='));

        assert.equal(template.values[deckNameBinding], 'Peter Parker');
        assert.equal(template.values[showDeckNameBinding], false);
    });

    const attachment = {
        id: 'attached-accessory',
        name: 'Attached accessory',
        isAttachment: true,
    };
    const attachedUpgrade = {
        id: 'attached-upgrade',
        name: 'Attached upgrade',
        isUpgrade: true,
    };
    const attached = [attachment, attachedUpgrade];

    test('forwards attachments without duplicating upgrades in the game zone', () => {
        const player = Object.assign(Object.create(McPlayer.prototype), {
            player: {
                handSize: 5,
                superhero: {
                    name: 'Hero',
                    image: 'hero',
                    life: 10,
                    attached,
                    abilities: [],
                },
            },
            canEndTurn: false,
        });

        const forwardedAttachments = player.renderSuperhero().values.find(
            value => Array.isArray(value) &&
                value.some(({id}) => id === attachment.id)
        );

        assert.deepEqual(forwardedAttachments, [attachment]);
    });

    test('renders superhero attachments on its card', () => {
        const superheroAttachments = [attachment];
        const superhero = Object.assign(
            Object.create(SuperheroCardComponent.prototype),
            {
                image: 'hero',
                life: 10,
                attached: superheroAttachments,
                abilities: [],
                extraTraits: [],
                extraKeywords: [],
                canEndTurn: false,
                flipped: false,
            }
        );

        assert.ok(superhero.render().values.includes(superheroAttachments));
    });

    test('does not render obligations above the superhero card', () => {
        const superhero = Object.assign(
            Object.create(SuperheroCardComponent.prototype),
            {
                image: 'hero',
                life: 10,
                abilities: [],
                extraTraits: [],
                extraKeywords: [],
                canEndTurn: false,
                flipped: false,
            }
        );

        assert.doesNotMatch(superhero.render().strings.join(''), /obligations/);
    });

    test('disables the identity-change menu option when flipping is not allowed', () => {
        const superhero = Object.assign(
            Object.create(SuperheroCardComponent.prototype),
            {
                abilities: [],
                canEndTurn: false,
                canFlip: false,
                flipped: false,
            }
        );
        const flipOption = superhero.menuOptions.find(({id}) => id === 'flip');

        assert.equal(flipOption.disable, true);
    });

    test('configures double-click to end the turn only when the player can end it', () => {
        const superhero = Object.assign(
            Object.create(SuperheroCardComponent.prototype),
            {
                abilities: [],
                canEndTurn: true,
                canFlip: false,
                flipped: false,
                tuckedCards: [],
            }
        );
        const doubleClickOptionIndex = superhero.render().strings.findIndex(part =>
            part.includes('.doubleClickOption=')
        );

        assert.equal(
            superhero.render().values[doubleClickOptionIndex],
            MENU_OPTION_END
        );

        superhero.canEndTurn = false;
        assert.equal(superhero.render().values[doubleClickOptionIndex], '');
    });

    test('activating the end-turn menu option emits the player-end event', () => {
        const superhero = Object.assign(
            Object.create(SuperheroCardComponent.prototype),
            {
                dispatchEvent(event) {
                    this.dispatchedEvent = event;
                },
            }
        );

        superhero.handleClickMenu({detail: {option: MENU_OPTION_END}});

        assert.equal(superhero.dispatchedEvent.type, 'player-end');
    });

    test('adds a tucked-card viewer option to the superhero menu', () => {
        const superhero = Object.assign(
            Object.create(SuperheroCardComponent.prototype),
            {
                abilities: [],
                canEndTurn: false,
                canFlip: false,
                flipped: false,
                tuckedCards: [{id: 'tucked-card'}],
            }
        );
        const viewOption = superhero.menuOptions.find(({text}) =>
            text === 'Ver cartas metidas debajo');

        assert.ok(viewOption);
    });

    test('adds contextual options and opens the menu when there is only one', () => {
        const events = [];
        const extraMenuOptions = [
            {id: MENU_OPTION_REQUEST_PLAYER_ACTION, text: 'Pedir una acción'},
        ];
        const superhero = Object.assign(
            Object.create(SuperheroCardComponent.prototype),
            {
                card: {id: 'hero'},
                abilities: [],
                canEndTurn: false,
                canFlip: false,
                flipped: false,
                extraMenuOptions,
                dispatchEvent(event) {
                    events.push(event);
                },
            },
        );

        assert.deepEqual(
            superhero.menuOptions.filter(option =>
                option.id === MENU_OPTION_REQUEST_PLAYER_ACTION ||
                option.id === MENU_OPTION_VIEW_HAND
            ),
            extraMenuOptions,
        );
        superhero.handleClickMenu({
            detail: {option: MENU_OPTION_REQUEST_PLAYER_ACTION},
        });

        assert.equal(events[0].type, 'change-menu');
        assert.equal(events[0].detail.card, superhero.card);
        assert.deepEqual(events[0].detail.menuOptions, superhero.menuOptions);
    });

    test('opens the tucked-card viewer from the superhero menu option', () => {
        const tuckedCards = [{id: 'tucked-card'}];
        const superhero = Object.assign(
            Object.create(SuperheroCardComponent.prototype),
            {
                name: 'Ms. Marvel',
                image: 'ms-marvel.png',
                tuckedCards,
                dispatchEvent(event) {
                    this.dispatchedEvent = event;
                },
            }
        );

        superhero.handleClickMenu({
            detail: {option: 'view-tucked-cards'},
        });

        assert.equal(superhero.dispatchedEvent.type, 'view-tucked-cards');
        assert.equal(superhero.dispatchedEvent.detail.card.name, 'Ms. Marvel');
        assert.equal(superhero.dispatchedEvent.detail.cards, tuckedCards);
    });

    test('forwards the server flip permission to the superhero card', () => {
        const player = Object.assign(Object.create(McPlayer.prototype), {
            player: {
                handSize: 5,
                superhero: {
                    name: 'Hero',
                    image: 'hero',
                    life: 10,
                    abilities: [],
                    canFlip: true,
                },
            },
            canEndTurn: false,
        });
        const template = player.renderSuperhero();
        const canFlipIndex = template.strings.findIndex(part =>
            part.includes('.canFlip="')
        );

        assert.notEqual(canFlipIndex, -1);
        assert.equal(template.values[canFlipIndex], true);
    });

    test('forwards contextual options to the superhero card menu', () => {
        const superheroMenuOptions = [
            {id: MENU_OPTION_REQUEST_PLAYER_ACTION, text: 'Pedir una acción'},
        ];
        const player = Object.assign(Object.create(McPlayer.prototype), {
            player: {
                handSize: 5,
                superhero: {
                    name: 'Hero',
                    image: 'hero',
                    life: 10,
                    abilities: [],
                },
            },
            superheroMenuOptions,
            canEndTurn: false,
        });
        const template = player.renderSuperhero();
        const optionsIndex = template.strings.findIndex(part =>
            part.includes('.extraMenuOptions=')
        );

        assert.deepEqual(template.values[optionsIndex], superheroMenuOptions);
    });

    test('keeps player obligations in the game zone instead of the superhero card', () => {
        const obligations = [{id: 'obligation', isObligation: true}];
        const player = Object.assign(Object.create(McPlayer.prototype), {
            player: {
                handSize: 5,
                gameZone: {
                    cards: obligations,
                    encounters: 0,
                    minions: [],
                },
                superhero: {
                    name: 'Hero',
                    image: 'hero',
                    life: 10,
                    attached: [],
                    abilities: [],
                },
            },
            canEndTurn: false,
        });
        const superheroTemplate = player.renderSuperhero();
        const gameZoneTemplate = player.renderGameZone();
        const cardsBinding = gameZoneTemplate.strings.findIndex(part =>
            part.includes('.cards=')
        );

        assert.equal(superheroTemplate.values.includes(obligations), false);
        assert.equal(gameZoneTemplate.values[cardsBinding], obligations);
    });
});
