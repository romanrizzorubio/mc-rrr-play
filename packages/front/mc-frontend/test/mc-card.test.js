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
const {McGameZone} = await import(
    '../src/components/panels/mc-game-zone/mc-game-zone.js'
);
const {ICON_EYE, ICON_EYE_SLASH, ICON_STAR} = await import(
    '../src/components/common/mc-icon/mc-icon.js'
);

const renderStats = ({
    attack,
    scheme,
    defense,
    unprintedStats,
    emphasizedStats = [],
}) => {
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
        emphasizedStats,
    });

    return card.renderStats();
};

const getStat = (template, label) => {
    const stats = template.values.find(Array.isArray);

    return stats.find(({values}) => values[1] === label);
};

const getStatValue = (template, label) => {
    return getStat(template, label).values[3];
};

test('uses the only available card action without opening the menu', () => {
    const events = [];
    const card = Object.assign(Object.create(CardComponent.prototype), {
        basicActivation: undefined,
        card: {id: 'policia-de-barrio'},
        clickDisabled: false,
        menuOptions: [
            {id: 'ability-0', disable: true},
            {id: 'ability-1', disable: false},
        ],
        tuckedCards: [],
        dispatchEvent(event) {
            events.push(event);
        },
    });

    card.handleClick();

    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'card-menu-click');
    assert.deepEqual(events[0].detail, {option: 'ability-1'});
});

test('keeps the menu when multiple card actions are available', () => {
    const events = [];
    const card = Object.assign(Object.create(CardComponent.prototype), {
        basicActivation: undefined,
        card: {id: 'policia-de-barrio'},
        clickDisabled: false,
        menuOptions: [
            {id: 'ability-0', disable: false},
            {id: 'ability-1', disable: false},
        ],
        tuckedCards: [],
        dispatchEvent(event) {
            events.push(event);
        },
    });

    card.handleClick();

    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'change-menu');
    assert.deepEqual(events[0].detail.menuOptions, card.menuOptions);
});

test('double-clicking a configured menu option activates it instead of the single-click menu', () => {
    const events = [];
    const card = Object.assign(Object.create(CardComponent.prototype), {
        basicActivation: undefined,
        card: {id: 'hero'},
        clickDisabled: false,
        doubleClickOption: 'end-turn',
        menuOptions: [
            {id: 'end-turn', disable: false},
            {id: 'flip', disable: false},
        ],
        tuckedCards: [],
        dispatchEvent(event) {
            events.push(event);
        },
    });
    const click = {
        stopPropagation() {},
    };

    card.handleClick({...click, detail: 1});
    assert.equal(events.length, 0);

    card.handleClick({...click, detail: 2});

    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'card-menu-click');
    assert.deepEqual(events[0].detail, {option: 'end-turn'});
});

test('a configured double-click option keeps the existing single-click menu behavior', () => {
    const events = [];
    const card = Object.assign(Object.create(CardComponent.prototype), {
        basicActivation: undefined,
        card: {id: 'hero'},
        clickDisabled: false,
        doubleClickOption: 'end-turn',
        menuOptions: [
            {id: 'end-turn', disable: false},
            {id: 'flip', disable: false},
        ],
        tuckedCards: [],
        dispatchEvent(event) {
            events.push(event);
        },
    });
    const originalSetTimeout = globalThis.setTimeout;
    let delayedClick;

    globalThis.setTimeout = callback => {
        delayedClick = callback;
        return 1;
    };
    try {
        card.handleClick({
            detail: 1,
            stopPropagation() {},
        });
    } finally {
        globalThis.setTimeout = originalSetTimeout;
    }

    assert.equal(events.length, 0);
    delayedClick();

    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'change-menu');
});

test('renders the MC RRR star for marked unprinted stats that equal zero', () => {
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

test('emphasizes only the configured character stat', () => {
    const template = renderStats({
        attack: 2,
        scheme: 1,
        defense: 3,
        unprintedStats: [],
        emphasizedStats: ['attack'],
    });
    const attack = getStat(template, 'ATQ');
    const scheme = getStat(template, 'PLA');

    assert.match(attack.values[0], /\bemphasized\b/);
    assert.doesNotMatch(scheme.values[0], /\bemphasized\b/);
});

test('centers main scheme counters alongside threat', () => {
    const card = Object.assign(Object.create(CardComponent.prototype), {
        acceleration: 0,
        generic: 3,
        horizontal: true,
        showGeneric: true,
        showThreat: true,
        threat: 2,
    });
    const template = card.renderCounters();
    const markup = template.values
        .filter(value => value?.strings)
        .map(value => value.strings.join(''))
        .join('');

    assert.ok(markup.indexOf('stat-threat') < markup.indexOf('stat-counters'));
    assert.match(markup, /aria-label="CONTADORES:/);

    const styles = CardComponent.styles.cssText;
    assert.match(
        styles,
        /\.counters\s*\{[^}]*display: grid;[^}]*grid-auto-columns: minmax\(0, 1fr\);[^}]*justify-items: center;/s
    );
    assert.match(styles, /\.counters > \.character-stat\s*\{[^}]*justify-self: center;/s);
    assert.doesNotMatch(styles, /\.counters > \.character-stat\s*\{[^}]*flex:/s);
    assert.match(styles, /\.acceleration,\s*\.threat\s*\{[^}]*margin: 0;/s);
});

test('shows stored threat alongside generic counters on vertical cards', () => {
    const card = Object.assign(Object.create(CardComponent.prototype), {
        acceleration: 0,
        damage: 0,
        generic: 3,
        handSize: undefined,
        hitPoints: undefined,
        horizontal: false,
        life: undefined,
        showDamage: false,
        showGeneric: true,
        showThreat: false,
        statusCards: {},
        threat: 2,
    });
    const counters = card.renderCounters();
    const threatCounter = counters.values.find(value =>
        value?.strings?.join('').includes('stat-threat')
    );
    const genericCounter = counters.values.find(value =>
        value?.strings?.join('').includes('stat-counters')
    );
    const bottomStats = card.renderBottomStats();

    assert.ok(threatCounter);
    assert.ok(genericCounter);
    assert.ok(
        counters.values.indexOf(threatCounter) <
            counters.values.indexOf(genericCounter)
    );
    assert.equal(threatCounter.values[0], 2);
    assert.equal(genericCounter.values[0], 3);
    assert.doesNotMatch(bottomStats.strings.join(''), /stat-counters/);
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

test('only playable cards in the hand can start a play-card drag', () => {
    const playableCard = Object.assign(Object.create(CardComponent.prototype), {
        allowPlayCardDrag: true,
        card: {id: 'playable-card', playable: true},
        dragActivation: null,
        dragPlayCard: null,
    });
    const unplayableCard = Object.assign(Object.create(CardComponent.prototype), {
        allowPlayCardDrag: true,
        card: {id: 'unplayable-card', playable: false},
        dragActivation: null,
        dragPlayCard: null,
    });

    assert.equal(playableCard.canDragPlayCard, true);
    assert.equal(unplayableCard.canDragPlayCard, false);
});

test('dims non-target cards and highlights card and parent-id play targets', () => {
    const dragPlayCard = {
        cardId: 'hand-card',
        targetIds: ['villain-side', 'scheme-id'],
        playableInGameZone: false,
    };
    const source = Object.assign(Object.create(CardComponent.prototype), {
        card: {id: 'hand-card'},
        dragPlayCard,
    });
    const validTarget = Object.assign(Object.create(CardComponent.prototype), {
        card: {id: 'villain-side'},
        dragPlayCard,
    });
    const parentTarget = Object.assign(Object.create(CardComponent.prototype), {
        card: {id: 'scheme-side', parentId: 'scheme-id'},
        dragPlayCard,
    });
    const invalidTarget = Object.assign(Object.create(CardComponent.prototype), {
        card: {id: 'other-card'},
        dragPlayCard,
    });

    assert.equal(source.isPlayCardDragSource, true);
    assert.equal(source.isPlayCardBlocked, false);
    assert.equal(validTarget.isPlayCardDropTarget, true);
    assert.equal(parentTarget.isPlayCardDropTarget, true);
    assert.equal(parentTarget.isPlayCardBlocked, false);
    assert.equal(invalidTarget.isPlayCardDropTarget, false);
    assert.equal(invalidTarget.isPlayCardBlocked, true);
});

test('dropping a hand card on a valid card target emits the play-card-drop event', () => {
    const playedCard = {id: 'event-card', playable: true};
    const target = Object.assign(Object.create(CardComponent.prototype), {
        card: {id: 'villain'},
        dragPlayCard: {
            card: playedCard,
            cardId: playedCard.id,
            targetIds: ['villain'],
        },
    });
    const dispatchedEvents = [];
    target.dispatchEvent = event => dispatchedEvents.push(event);
    let prevented = false;
    let stopped = false;

    target.handleDrop({
        preventDefault() {
            prevented = true;
        },
        stopPropagation() {
            stopped = true;
        },
    });

    assert.equal(prevented, true);
    assert.equal(stopped, true);
    assert.equal(dispatchedEvents[0].type, 'play-card-drop');
    assert.equal(dispatchedEvents[0].detail.card, playedCard);
    assert.strictEqual(dispatchedEvents[0].detail.targetCard, target.card);
});

test('the player game zone only accepts a card drop when the card can be played there', () => {
    const playedCard = {id: 'support-card', playable: true};
    const gameZone = Object.assign(Object.create(McGameZone.prototype), {
        dragPlayCard: {
            card: playedCard,
            playableInGameZone: true,
        },
    });
    const dispatchedEvents = [];
    gameZone.dispatchEvent = event => dispatchedEvents.push(event);
    let prevented = false;

    gameZone.handlePlayCardDragOver({
        preventDefault() {
            prevented = true;
        },
    });
    gameZone.handlePlayCardDrop({
        preventDefault() {},
        stopPropagation() {},
    });

    assert.equal(prevented, true);
    assert.equal(dispatchedEvents[0].type, 'play-card-drop');
    assert.equal(dispatchedEvents[0].detail.card, playedCard);

    gameZone.dragPlayCard.playableInGameZone = false;
    prevented = false;
    gameZone.handlePlayCardDragOver({
        preventDefault() {
            prevented = true;
        },
    });
    assert.equal(prevented, false);
});

test('mc-card-image can dim non-target card backs and discard cards', () => {
    assert.equal(McCardImage.properties.activationBlocked.reflect, true);
    assert.match(
        McCardImage.styles.cssText,
        /:host\(\[activation-blocked\]\) img\s*\{\s*filter: brightness\(0\.4\)/
    );
    assert.match(
        McCardImage.styles.cssText,
        /img\s*\{\s*display: block;/
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

test('passes activation and play-card drag state to cards in the player hand', () => {
    const dragActivation = {actor: {id: 'hero-1'}};
    const dragPlayCard = {cardId: 'event-card', targetIds: []};
    const hand = Object.assign(Object.create(McHand.prototype), {
        cards: [],
        dragActivation,
        dragPlayCard,
        playCardPending: false,
        showPanel: true,
    });
    const template = hand.render();

    assert.ok(template.strings.join('').includes('<mc-card-list'));
    assert.ok(template.values.includes(dragActivation));
    assert.ok(template.values.includes(dragPlayCard));
    assert.ok(template.values.includes(true));
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
    const previews = template.values.find(Array.isArray);
    const styles = CardComponent.styles.cssText;

    assert.equal(previews.length, 2);
    assert.ok(previews.every(preview =>
        preview.strings.join('').includes('class="tucked-card-peek"')
    ));
    assert.deepEqual(
        previews.map(preview => preview.values[0]),
        [
            'images/cards/tucked-one.png',
            'images/cards/tucked-two.png',
        ]
    );
    assert.match(styles, /top: calc\(100% - 8px\)/);
    assert.match(styles, /height: 16px/);
    assert.match(styles, /\.tucked-card-peek\s*\{[^}]*align-items: flex-end/s);
});

test('renders side-scheme facedown cards as back peeks beneath the host card', () => {
    const card = Object.assign(Object.create(CardComponent.prototype), {
        card: {isSideScheme: true},
        faceDown: [{isPlayerCard: true}],
        tuckedCards: [],
        size: 'm',
    });
    const template = card.renderTucked();
    const previews = template.values.find(Array.isArray);

    assert.ok(template.values.includes('side-scheme-facedown'));
    assert.equal(previews.length, 1);
    assert.equal(
        previews[0].values[0],
        'images/cards/back/player.jpg'
    );
    assert.equal(card.renderFaceDown().strings.join(''), '');
    assert.match(
        CardComponent.styles.cssText,
        /\.tucked\.side-scheme-facedown\s*\{[^}]*position: static;/s
    );
});

test('places side-scheme facedown peeks before scheme counters', () => {
    const peek = {};
    const counters = {};
    const card = Object.assign(Object.create(CardComponent.prototype), {
        activationActor: {abilities: []},
        card: {isSideScheme: true},
        dragActivation: null,
        dragPlayCard: null,
        dragResourcePayment: null,
        exhausted: false,
        faceDown: [{isPlayerCard: true}],
        horizontal: true,
        image: 'portal.png',
        isFacedownCard: false,
        name: 'Abrir un portal a la Dimensión Oscura',
        rotated: false,
        size: 'm',
        tuckedCards: [],
        renderHeader: () => '',
        renderStats: () => '',
        renderTucked: () => peek,
        renderStage: () => '',
        renderFacedownPeekButton: () => '',
        renderCounters: () => counters,
        renderBottomStats: () => '',
        renderAcquiredTraits: () => '',
        renderAcquiredKeywords: () => '',
        renderAttached: () => '',
        renderFaceDown: () => '',
        renderMenu: () => '',
    });
    const template = card.renderCard();

    assert.ok(template.values.indexOf(peek) < template.values.indexOf(counters));
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

test('starting and ending a drag supports a targeted attack action on an upgrade', () => {
    const upgrade = {
        abilities: [{
            availableTargetIds: ['villain-1'],
            disable: false,
            index: 1,
            isAction: true,
            isAttack: true,
            isBasic: false,
            isThwart: false,
            name: 'Disparar',
        }],
        id: 'energy-channel',
        isUpgrade: true,
    };
    const source = Object.assign(Object.create(CardComponent.prototype), {
        activationActor: upgrade,
    });
    let dragStart;
    source.dispatchEvent = event => {
        dragStart = event;
        return true;
    };

    source.handleActivationDragStart({
        dataTransfer: {
            effectAllowed: '',
            setData() {},
        },
    });

    assert.equal(dragStart.type, 'activation-drag-start');
    assert.equal(dragStart.detail.options[0].text, 'Disparar');

    const target = Object.assign(Object.create(CardComponent.prototype), {
        card: {id: 'villain-1', name: 'Rhino'},
        dragActivation: {actor: upgrade},
    });
    let drop;
    target.dispatchEvent = event => {
        drop = event;
        return true;
    };

    target.handleActivationDrop({
        preventDefault() {},
        stopPropagation() {},
    });

    assert.equal(drop.type, 'basic-activation');
    assert.equal(drop.detail.actor, upgrade);
    assert.equal(drop.detail.card, target.card);
    assert.equal(drop.detail.option.abilityIndex, 1);
    assert.equal(drop.detail.option.targetId, 'villain-1');
    assert.equal(drop.detail.option.basicActivation, undefined);
});

test('dragging a resource card selects a compatible ability payment', () => {
    const resource = {
        id: 'energy-card',
        isResource: true,
    };
    const source = Object.assign(Object.create(CardComponent.prototype), {
        card: resource,
        dragActivation: null,
        dragPlayCard: null,
        dragResourcePayment: null,
    });
    let dragStart;
    source.dispatchEvent = event => {
        dragStart = event;
        return true;
    };

    source.handleDragStart({
        dataTransfer: {
            effectAllowed: '',
            setData() {},
        },
    });

    assert.equal(dragStart.type, 'resource-payment-drag-start');
    assert.equal(dragStart.detail.source, 'hand');

    const targetCard = {
        abilities: [{
            index: 0,
            resourcePayment: {
                sourceIds: [resource.id],
            },
        }],
        id: 'energy-channel',
    };
    const target = Object.assign(Object.create(CardComponent.prototype), {
        card: targetCard,
        dragResourcePayment: {
            card: resource,
            source: 'hand',
        },
    });
    let drop;
    target.dispatchEvent = event => {
        drop = event;
        return true;
    };

    target.handleDrop({
        preventDefault() {},
        stopPropagation() {},
    });

    assert.equal(drop.type, 'resource-payment-drop');
    assert.equal(drop.detail.card, resource);
    assert.equal(drop.detail.targetCard, targetCard);
    assert.deepEqual(drop.detail.option, {
        abilityIndex: 0,
        cardId: resource.id,
        source: 'hand',
    });
});

test('a resource generator can be dragged as a payment source', () => {
    const generator = {
        abilities: [{isResource: true}],
        id: 'energy-generator',
    };
    const card = Object.assign(Object.create(CardComponent.prototype), {
        card: generator,
        dragActivation: null,
        dragPlayCard: null,
        dragResourcePayment: null,
    });

    assert.equal(card.canDragResourcePayment, true);
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
