import assert from 'node:assert/strict';
import {test} from 'node:test';

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
const {McCardImage} = await import(
    '../src/components/cards/mc-card-image/mc-card-image.js'
);
const {DeckComponent, DECK_TYPES} = await import(
    '../src/components/panels/mc-deck/mc-deck.js'
);
const {McHand} = await import(
    '../src/components/panels/mc-hand/mc-hand.js'
);
const {ICON_EYE, ICON_EYE_SLASH, ICON_STAR} = await import(
    '../src/components/common/mc-icon/mc-icon.js'
);

const renderStats = ({attack, scheme, defense, unprintedStats}) => {
    const card = Object.assign(Object.create(CardComponent.prototype), {
        showBasicStats: true,
        nameWithStage: false,
        stage: undefined,
        attack,
        scheme,
        defense,
        thwart: undefined,
        recovery: undefined,
        unprintedStats,
    });

    return card.renderStats();
};

const getStatValue = (template, label) => {
    const stats = template.values.find(Array.isArray);
    const stat = stats.find(({values}) => values[1] === label);

    return stat.values[3];
};

test('renders the Marvel Champions star for marked unprinted stats that equal zero', () => {
    const template = renderStats({
        attack: 0,
        scheme: 0,
        defense: 0,
        unprintedStats: ['attack', 'scheme'],
    });
    const attack = getStatValue(template, 'ATQ');
    const scheme = getStatValue(template, 'PLA');
    const defense = getStatValue(template, 'DEF');

    assert.match(attack.strings.join(''), /class="stat-star"/);
    assert.match(attack.strings.join(''), /<mc-icon icon=/);
    assert.equal(attack.values[0], ICON_STAR);
    assert.match(scheme.strings.join(''), /class="stat-star"/);
    assert.match(scheme.strings.join(''), /<mc-icon icon=/);
    assert.equal(scheme.values[0], ICON_STAR);
    assert.match(defense.strings.join(''), /numeric-value/);
    assert.equal(defense.values[0], 0);
});

test('renders the calculated value when an unprinted stat becomes nonzero', () => {
    const template = renderStats({
        attack: 1,
        scheme: 0,
        defense: 0,
        unprintedStats: ['attack', 'scheme'],
    });
    const attack = getStatValue(template, 'ATQ');

    assert.match(attack.strings.join(''), /numeric-value/);
    assert.equal(attack.values[0], 1);
});

test('uses a diffuse green halo on legal targets and veils only non-target images', () => {
    const styles = CardComponent.styles.cssText;
    const imageStyles = McCardImage.styles.cssText;

    assert.match(
        styles,
        /\.card-front\.activation-drop-target > mc-card-image[\s\S]*?drop-shadow\(0 0 4px rgba\(0, 200, 83, 0\.95\)\)/
    );
    assert.doesNotMatch(styles, /outline: 3px solid/);
    assert.match(
        imageStyles,
        /:host\(\[activation-blocked\]\) img\s*\{\s*filter: brightness\(0\.4\)/
    );
    assert.doesNotMatch(styles, /activation-card-veil/);
    assert.doesNotMatch(styles, /activation-veiled/);
});

test('veils non-target cards but keeps the dragged actor and valid targets clear', () => {
    const actor = {
        abilities: [{
            availableTargetIds: ['villain-1'],
            disable: false,
            index: 0,
            isAttack: true,
            isBasic: true,
            isThwart: false,
        }],
        id: 'ally-1',
    };
    const dragActivation = {actor};
    const invalidCard = Object.assign(Object.create(CardComponent.prototype), {
        card: {id: 'ally-2'},
        dragActivation,
        activationActor: null,
    });
    const validTarget = Object.assign(Object.create(CardComponent.prototype), {
        card: {id: 'villain-1'},
        dragActivation,
        activationActor: null,
    });
    const draggedActor = Object.assign(Object.create(CardComponent.prototype), {
        card: null,
        dragActivation,
        activationActor: actor,
    });

    assert.equal(invalidCard.isActivationVeiled, true);
    assert.equal(validTarget.isActivationDropTarget, true);
    assert.equal(validTarget.isActivationVeiled, false);
    assert.equal(draggedActor.isActivationDragSource, true);
    assert.equal(draggedActor.isActivationVeiled, false);
});

test('mc-card-image can dim non-target card backs and discard cards', () => {
    assert.equal(McCardImage.properties.activationBlocked.reflect, true);
    assert.match(
        McCardImage.styles.cssText,
        /:host\(\[activation-blocked\]\) img\s*\{\s*filter: brightness\(0\.4\)/
    );
});

test('veils deck and discard images while a drag activation is active', () => {
    const dragActivation = {actor: {id: 'hero-1'}};
    const deck = Object.assign(Object.create(DeckComponent.prototype), {
        dragActivation,
        type: DECK_TYPES.PLAYER,
    });
    const stack = deck.renderCardStack('player-back.png', 8);
    const noDragStack = Object.assign(Object.create(DeckComponent.prototype), {
        dragActivation: null,
        type: DECK_TYPES.PLAYER,
    }).renderCardStack('player-back.png', 8);

    assert.equal(stack.values[2], true);
    assert.equal(noDragStack.values[2], false);
});

test('passes the activation drag state to cards in the player hand', () => {
    const dragActivation = {actor: {id: 'hero-1'}};
    const hand = Object.assign(Object.create(McHand.prototype), {
        cards: [],
        dragActivation,
        playCardPending: false,
        showPanel: true,
    });
    const template = hand.render();

    assert.ok(template.strings.join('').includes('<mc-card-list'));
    assert.ok(template.values.includes(dragActivation));
});

test('renders tucked cards as a short visible strip beneath the host card', () => {
    const card = Object.assign(Object.create(CardComponent.prototype), {
        tuckedCards: [
            {image: 'tucked-one.png'},
            {image: 'tucked-two.png'},
            {image: 'tucked-three.png'},
        ],
        size: 'm',
    });
    const template = card.renderTucked();
    const styles = CardComponent.styles.cssText;

    assert.equal(template.values[0].length, 2);
    assert.ok(template.values[0].every(preview =>
        preview.strings.join('').includes('class="tucked-card-peek"')
    ));
    assert.deepEqual(
        template.values[0].map(preview => preview.values[0]),
        [
            'images/cards/tucked-one.png',
            'images/cards/tucked-two.png',
        ]
    );
    assert.match(styles, /top: calc\(100% - 8px\)/);
    assert.match(styles, /height: 16px/);
    assert.match(styles, /\.tucked-card-peek\s*\{[^}]*align-items: flex-end/s);
});

test('shows generic counters on cards attached to any host', () => {
    const card = Object.assign(Object.create(CardComponent.prototype), {
        attached: [{id: 'countered-accessory', counters: 3}],
        dragActivation: null,
        size: 'm',
    });
    const template = card.renderAttached();

    assert.ok(template.strings.join('').includes('show-generic'));
});

test('renders acquired keywords below the image rather than beside its stats', () => {
    const card = Object.assign(Object.create(CardComponent.prototype), {
        activationActor: {abilities: []},
        dragActivation: null,
        exhausted: false,
        extraKeywords: [{name: 'retaliate'}],
        extraTraits: ['example'],
        facedownImage: '',
        faceDown: [],
        horizontal: false,
        image: 'villain.png',
        isFacedownCard: false,
        name: 'Villain',
        rotated: false,
        showAcquiredTraits: true,
        size: 'm',
        tuckedCards: [],
        _showFacedownPreview: false,
    });
    const acquiredTraits = card.renderAcquiredTraits();
    const acquiredKeywords = card.renderAcquiredKeywords();
    const bottomStats = {};
    const attached = {};
    Object.assign(card, {
        renderHeader: () => '',
        renderTucked: () => '',
        renderStage: () => '',
        renderFacedownPeekButton: () => '',
        renderCounters: () => '',
        renderBottomStats: () => bottomStats,
        renderAcquiredTraits: () => acquiredTraits,
        renderAcquiredKeywords: () => acquiredKeywords,
        renderAttached: () => attached,
        renderFaceDown: () => '',
        renderMenu: () => '',
    });

    const template = card.renderCard();
    const divDepthAt = value => {
        const valueIndex = template.values.indexOf(value);
        assert.notEqual(valueIndex, -1);

        const markupBeforeValue = template.strings
            .slice(0, valueIndex + 1)
            .join('');
        const cardFaceStart = markupBeforeValue.lastIndexOf(
            '<div class="card-face">'
        );
        assert.notEqual(cardFaceStart, -1);

        return (markupBeforeValue.slice(cardFaceStart).match(/<\/?div\b/g) || [])
            .reduce((depth, tag) => depth + (tag.startsWith('</') ? -1 : 1), 0);
    };

    assert.equal(acquiredKeywords.values[0][0].values[0], 'Represalia');
    assert.ok(template.values.indexOf(bottomStats) <
        template.values.indexOf(acquiredTraits));
    assert.ok(template.values.indexOf(acquiredTraits) <
        template.values.indexOf(acquiredKeywords));
    assert.ok(template.values.indexOf(acquiredKeywords) <
        template.values.indexOf(attached));
    assert.equal(divDepthAt(acquiredTraits), 1);
    assert.equal(divDepthAt(acquiredKeywords), 1);
    assert.match(
        CardComponent.styles.cssText,
        /\.card-face\s*\{[^}]*width: var\(--card-size\)/s
    );
    assert.match(
        CardComponent.styles.cssText,
        /\.acquired-keywords\s*\{[^}]*width: 100%/s
    );
});

test('peeks at a facedown card and toggles the eye affordance to hide it again', () => {
    const card = Object.assign(Object.create(CardComponent.prototype), {
        canPeekFacedown: true,
        isFacedownCard: true,
        _showFacedownPreview: false,
    });
    const eyeButton = card.renderFacedownPeekButton();

    assert.ok(eyeButton.values.includes(ICON_EYE));
    assert.equal(card.isFacedownHidden(), true);

    card.handleFacedownPreviewClick({stopPropagation() {}});
    assert.equal(card.isFacedownHidden(), false);
    assert.ok(card.renderFacedownPeekButton().values.includes(ICON_EYE_SLASH));

    card.handleFacedownPreviewClick({stopPropagation() {}});
    assert.equal(card.isFacedownHidden(), true);
});

test('starting a drag publishes the actor and its legal basic activations', () => {
    const ally = {
        abilities: [{
            availableTargetIds: ['villain-1'],
            disable: false,
            index: 2,
            isAttack: true,
            isBasic: true,
            isThwart: false,
        }],
        id: 'ally-1',
    };
    const card = Object.assign(Object.create(CardComponent.prototype), {
        activationActor: ally,
    });
    let dispatchedEvent;
    let dragPayload;
    card.dispatchEvent = event => {
        dispatchedEvent = event;
        return true;
    };
    const event = {
        dataTransfer: {
            effectAllowed: '',
            setData(type, value) {
                dragPayload = {type, value};
            },
        },
        preventDefault() {
            throw new Error('A legal actor drag should not be prevented.');
        },
    };

    card.handleActivationDragStart(event);

    assert.equal(dispatchedEvent.type, 'activation-drag-start');
    assert.equal(dispatchedEvent.detail.actor, ally);
    assert.equal(dispatchedEvent.detail.options[0].activationType, 'attack');
    assert.deepEqual(dragPayload, {type: 'text/plain', value: 'ally-1'});
});

test('does not cancel a card drag when there is no in-play activation actor', () => {
    const card = Object.assign(Object.create(CardComponent.prototype), {
        activationActor: null,
    });
    let prevented = false;

    card.handleActivationDragStart({
        preventDefault() {
            prevented = true;
        },
    });

    assert.equal(prevented, false);
});

test('cancels native dragging for an in-play actor without legal activations', () => {
    const card = Object.assign(Object.create(CardComponent.prototype), {
        activationActor: {abilities: [], id: 'ally-1'},
    });
    let prevented = false;

    card.handleActivationDragStart({
        preventDefault() {
            prevented = true;
        },
    });

    assert.equal(prevented, true);
});

test('dropping an ally on a legal target emits the selected basic activation', () => {
    const ally = {
        abilities: [{
            availableTargetIds: ['villain-1'],
            disable: false,
            index: 2,
            isAttack: true,
            isBasic: true,
            isThwart: false,
        }],
        id: 'ally-1',
    };
    const target = {id: 'villain-1', name: 'Rhino'};
    const card = Object.assign(Object.create(CardComponent.prototype), {
        card: target,
        dragActivation: {actor: ally},
    });
    let dispatchedEvent;
    let prevented = false;
    let stopped = false;
    card.dispatchEvent = event => {
        dispatchedEvent = event;
        return true;
    };

    card.handleActivationDrop({
        preventDefault() {
            prevented = true;
        },
        stopPropagation() {
            stopped = true;
        },
    });

    assert.equal(dispatchedEvent.type, 'basic-activation');
    assert.equal(dispatchedEvent.detail.actor, ally);
    assert.equal(dispatchedEvent.detail.card, target);
    assert.equal(dispatchedEvent.detail.option.abilityIndex, 2);
    assert.equal(dispatchedEvent.detail.option.activationType, 'attack');
    assert.equal(dispatchedEvent.detail.option.targetId, 'villain-1');
    assert.equal(prevented, true);
    assert.equal(stopped, true);
});

test('dropping an ally on a non-legal target does not start an activation', () => {
    const ally = {
        abilities: [{
            availableTargetIds: ['villain-1'],
            disable: false,
            index: 2,
            isAttack: true,
            isBasic: true,
            isThwart: false,
        }],
        id: 'ally-1',
    };
    const card = Object.assign(Object.create(CardComponent.prototype), {
        card: {id: 'villain-2'},
        dragActivation: {actor: ally},
    });
    let dispatched = false;
    let prevented = false;
    card.dispatchEvent = () => {
        dispatched = true;
        return true;
    };

    card.handleActivationDrop({
        preventDefault() {
            prevented = true;
        },
        stopPropagation() {},
    });

    assert.equal(dispatched, false);
    assert.equal(prevented, false);
});
