import assert from 'node:assert/strict';
import {test} from 'node:test';

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

const {SuperheroCardComponent} = await import(
    '../src/components/cards/characters/mc-superhero-card/mc-superhero-card.js'
);
const {McPlayer} = await import(
    '../src/components/match/mc-player/mc-player.js'
);

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
        value => Array.isArray(value) && value.some(({id}) => id === attachment.id)
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
