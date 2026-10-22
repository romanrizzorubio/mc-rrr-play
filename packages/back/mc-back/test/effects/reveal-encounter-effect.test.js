import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_ATTACHMENT,
    DIALOG_SURGE,
    PLACE_ENCOUNTER_DECK,
    PLACE_ENCOUNTER_DISCARD,
    PLACE_PLAYER_ENCOUNTERS,
    PLACE_SCENARIO_EXTRA_DECK,
    TARGET_MINION,
    TARGET_YOU,
    PRIORITY_FORCED_RESPONSE,
    TRIGGER_ENGAGE_HERO,
} from 'mc-shared';
import {CANCEL_ENCOUNTER_FULL} from '../../src/effects/cancel-encounter-effect.js';
import {AttachEffect} from '../../src/effects/attach-effect.js';
import {GetEncounterCardEffect} from '../../src/effects/get-encounter-card-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {Player} from '../../src/model/match/player.js';
import {
    restoreMatch,
    serializeMatch,
} from '../../src/utils/match-serialization.js';
import riskyBusiness from '../../../mc-data/seed/catalog/scenarios/risky-business.js';

const createEncounterCard = id => ({
    id,
    isEncounterCard: true,
    toObj() {
        return {id: this.id};
    },
});

describe('Encounter reveal effect', () => {
test('GetEncounterCardEffect retrieves a dealt card without revealing it', async () => {
    const first = createEncounterCard('first');
    const second = createEncounterCard('second');
    const player = {encounters: [first, second]};
    const effect = new GetEncounterCardEffect({
        from: PLACE_PLAYER_ENCOUNTERS,
        match: {},
    });

    assert.equal(await effect.canRun({player}), true);
    await effect.execute({player});

    assert.strictEqual(effect.card, first);
    assert.deepEqual(player.encounters, [second]);
});

test('RevealEncounterEffect only shows the supplied encounter card', async () => {
    const topCard = createEncounterCard('top');
    const pendingCard = createEncounterCard('pending');
    const player = {encounters: [pendingCard]};
    const effect = new RevealEncounterEffect({
        selectedTarget: topCard,
        match: {},
    });
    let revealedCard;
    effect.openDialog = async ({data}) => {
        revealedCard = data.card;
    };

    assert.equal(await effect.canRun({player}), true);
    await effect.prepare({player});

    assert.deepEqual(revealedCard, {id: 'top'});
    assert.deepEqual(player.encounters, [pendingCard]);
    assert.strictEqual(effect.selectedTarget, topCard);
});

test('Incite places threat when the encounter card is revealed', async () => {
    const mainScheme = {
        isMainScheme: true,
        isScheme: true,
        threat: 0,
        value: 100,
        placeThreat(threat) {
            this.threat += threat;
        },
        async refresh() {},
    };
    const match = {
        limits: {},
        mainScheme,
        scenario: {mainScheme},
        triggerCards: {},
    };
    const card = {
        abilities: [],
        incite: 1,
        name: 'Tropa de Hydra',
    };
    const effect = new RevealEncounterEffect({
        match,
        selectedTarget: card,
    });

    await effect.reveal({player: {}});

    assert.equal(mainScheme.threat, 1);
});

test('GetEncounterCardEffect can remove a chosen card from the encounter deck', async () => {
    const topCard = createEncounterCard('top');
    const movedCard = createEncounterCard('moved');
    const chosenCard = createEncounterCard('chosen');
    const deck = {
        cards: [topCard, chosenCard],
        discardPile: [],
        async searchDeck(card) {
            const index = this.cards.indexOf(card);
            if (index >= 0) {
                this.cards.splice(index, 1);
            }
        },
    };
    const effect = new GetEncounterCardEffect({
        from: PLACE_ENCOUNTER_DECK,
        cardSource: 'selectedCards',
        match: {scenario: {deck}},
    });

    assert.equal(await effect.canRun({
        selectedCards: [movedCard, chosenCard],
    }), true);
    await effect.execute({
        selectedCards: [movedCard, chosenCard],
    });

    assert.strictEqual(effect.card, chosenCard);
    assert.deepEqual(deck.cards, [topCard]);
});

test('GetEncounterCardEffect gets from an auxiliary deck before RevealEncounterEffect displays it', async () => {
    const topCard = createEncounterCard('experimental-weapon');
    const extraDeck = {
        cards: [topCard],
        async refresh() {},
    };
    const match = {
        scenario: {
            getExtraDeck(id) {
                assert.equal(id, 'experimental-weapons');
                return extraDeck;
            },
        },
    };
    const getEffect = new GetEncounterCardEffect({
        from: PLACE_SCENARIO_EXTRA_DECK,
        deckId: 'experimental-weapons',
        match,
    });
    const effect = new RevealEncounterEffect({
        selectedTarget: topCard,
        match,
    });
    let revealedCard;
    effect.openDialog = async ({data}) => {
        revealedCard = data.card;
    };

    assert.equal(await getEffect.canRun({player: {}}), true);
    await getEffect.execute({player: {}});
    assert.strictEqual(getEffect.card, topCard);
    assert.deepEqual(extraDeck.cards, []);

    assert.equal(await effect.canRun({player: {}}), true);
    await effect.prepare({player: {}});

    assert.deepEqual(revealedCard, {id: 'experimental-weapon'});
    assert.strictEqual(effect.selectedTarget, topCard);
});

test('GetEncounterCardEffect removes a chained discard-until card before it is revealed', async () => {
    const discardedCard = createEncounterCard('weapon');
    const encounterDiscard = [discardedCard];
    const encounterDeck = {
        discardPile: encounterDiscard,
        searchDiscard(card) {
            const index = this.discardPile.indexOf(card);
            if (index >= 0) {
                this.discardPile.splice(index, 1);
            }
        },
        async refresh() {},
    };
    const getEffect = new GetEncounterCardEffect({
        from: PLACE_ENCOUNTER_DISCARD,
        cardSource: 'selectedCard',
        match: {scenario: {deck: encounterDeck}},
    });
    const effect = new RevealEncounterEffect({
        card: 'effects.0.card',
        match: {scenario: {deck: encounterDeck}},
    });
    let revealedCard;
    effect.openDialog = async ({data}) => {
        revealedCard = data.card;
    };

    assert.equal(await getEffect.canRun({
        selectedCard: discardedCard,
    }), true);
    await getEffect.execute({
        player: {},
        selectedCard: discardedCard,
    });
    assert.deepEqual(encounterDiscard, []);
    assert.equal(await effect.canRun({
        effects: [getEffect],
    }), true);
    await effect.prepare({
        effects: [getEffect],
        player: {},
    });

    assert.deepEqual(revealedCard, {id: 'weapon'});
    assert.deepEqual(encounterDiscard, []);
    assert.strictEqual(effect.selectedTarget, discardedCard);
});

test('surge shows an encounter-back dialog before drawing and can hide future notices', async () => {
    const dialogs = [];
    const steps = [];
    const extraEncounter = createEncounterCard('surge');
    const match = {
        skipSurgeNotification: false,
        triggerCards: {},
        scenario: {
            deck: {
                cards: [extraEncounter],
                discardPile: [],
            },
        },
        async openDialog(dialog) {
            dialogs.push(dialog);
            steps.push('dialog');

            return {skipSurgeNotification: true};
        },
        async drawEncounterCards() {
            steps.push('draw');

            return [extraEncounter];
        },
    };
    const selectedTarget = {
        createDelayedEffect() {},
        endTriggers() {},
    };
    const effect = new RevealEncounterEffect({
        match,
        selectedTarget,
    });

    await effect.applySurge({player: {}});

    assert.deepEqual(steps, ['dialog', 'draw']);
    assert.equal(dialogs[0].dialogType, DIALOG_SURGE);
    assert.equal(dialogs[0].title, 'Oleada');
    assert.equal(
        dialogs[0].subtitle,
        'Se resuelve una Oleada: se revela y resuelve una carta adicional del mazo de Encuentros.'
    );
    assert.equal(dialogs[0].data.allowHideFuture, true);
    assert.equal(match.skipSurgeNotification, true);

    await effect.applySurge({player: {}});

    assert.deepEqual(steps, ['dialog', 'draw', 'draw']);
    assert.equal(dialogs.length, 1);
});

test('surge notification preference persists with the match', () => {
    const match = new Match({
        mc: {},
        name: 'surge-notification-preference',
    });
    match.skipSurgeNotification = true;

    const restoredMatch = restoreMatch(serializeMatch(match), {});

    assert.equal(restoredMatch.skipSurgeNotification, true);
});

test('RevealEncounterEffect identifies the villain in the reveal dialog', async () => {
    const villain = {
        ...createEncounterCard('villain'),
        isVillain: true,
    };
    const effect = new RevealEncounterEffect({
        match: {},
        selectedTarget: villain,
    });
    let title;
    effect.openDialog = async dialog => {
        title = dialog.title;
    };

    await effect.prepare({player: {}});

    assert.equal(title, 'Mostrando al villano');
});

test('RevealEncounterEffect marks scheme cards as horizontal in the reveal dialog', async () => {
    const sideScheme = {
        ...createEncounterCard('side-scheme'),
        isSideScheme: true,
    };
    const effect = new RevealEncounterEffect({
        match: {},
        selectedTarget: sideScheme,
    });
    let horizontal;
    effect.openDialog = async ({data}) => {
        horizontal = data.horizontal;
    };

    await effect.prepare({player: {}});

    assert.equal(horizontal, true);
});

test('RevealEncounterEffect does not show a dialog for main scheme sides', async () => {
    const schemeSide = {
        ...createEncounterCard('main-scheme-a'),
        isMainScheme: true,
    };
    const effect = new RevealEncounterEffect({
        match: {},
        selectedTarget: schemeSide,
    });
    let dialogCount = 0;
    effect.openDialog = async () => {
        dialogCount++;
    };

    await effect.prepare({player: {}});

    assert.equal(dialogCount, 0);
    assert.equal(effect.selectedTarget, schemeSide);
});

test('RevealEncounterEffect selects the identity-matching conditional ability', async () => {
    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'conditional-reveal',
    });
    match.scenario = {
        villain: {name: 'Norman Osborn'},
    };
    const factory = new MatchFactory(match);
    const cardConfig = riskyBusiness.config.cards.find(({card}) =>
        card.params.name === 'Genio loco').card;
    const card = factory.cardsFactory.createGameCardFromConfig(cardConfig);
    const selectedAbilities = [];
    card.abilities
        .filter(ability => ability.isWhenRevealed)
        .forEach(ability => {
            ability.resolveAbility = async () => {
                selectedAbilities.push(ability.condition['player.match.scenario.villain.name']);
            };
        });
    const player = {match};
    const effect = new RevealEncounterEffect({
        match,
        selectedTarget: card,
    });

    await effect.reveal({player});

    assert.deepEqual(selectedAbilities, ['Norman Osborn']);
});

test('Quickstrike resolves after a minion\'s When Revealed ability', async () => {
    const resolutionOrder = [];
    const scenario = {};
    const match = {
        isUniqueCard: () => false,
        scenario,
        triggerCards: {},
    };
    const player = {
        isHero: true,
        engage() {},
        async refresh() {},
    };
    const quickstrikeTrigger = {
        ability: {
            hideDialog: true,
            isOptionAbility: false,
        },
        canTrigger: ({effect, player}) =>
            player.isHero && effect.selectedTarget === player,
        async runTrigger() {
            resolutionOrder.push('quickstrike');
        },
    };
    const whenRevealedAbility = {
        isWhenRevealed: true,
        isValidIdentity: () => true,
        async resolveAbility() {
            resolutionOrder.push('when revealed');
            this.resolved = true;
        },
    };
    const minion = {
        id: 'quickstrike-minion',
        abilities: [whenRevealedAbility],
        damage: 0,
        faceTo: TARGET_YOU,
        isAttachable: false,
        isEncounterCard: true,
        isInPlay: false,
        isMain: false,
        isMinion: true,
        isTreachery: false,
        isSideScheme: false,
        isAttachment: false,
        isVillain: false,
        surge: false,
        triggers: {
            [TRIGGER_ENGAGE_HERO]: {
                [PRIORITY_FORCED_RESPONSE]: [quickstrikeTrigger],
            },
        },
        async initTriggers() {
            match.triggerCards[this.id] = this;
        },
        async refresh() {},
        endTriggers() {},
        toObj() {
            return {id: this.id};
        },
    };
    const effect = new RevealEncounterEffect({
        match,
        selectedTarget: minion,
    });

    await effect.execute({player});

    assert.deepEqual(resolutionOrder, ['when revealed', 'quickstrike']);
    assert.equal(minion.controller, scenario);
});

test('a fully canceled encounter card is discarded', async () => {
    let discarded = false;
    const effect = new RevealEncounterEffect({match: {}});
    effect.selectedTarget = {
        isEncounterCard: true,
        async discard() {
            discarded = true;
        },
    };
    effect.trigger = async () => {
        effect.canceled = CANCEL_ENCOUNTER_FULL;
        return false;
    };

    assert.equal(await effect.triggerInit({}), false);
    assert.equal(discarded, true);
});

test('an attachment with no valid target is discarded and keeps its printed surge', async () => {
    let discarded = false;
    let surgeCount = 0;
    const match = {
        isUniqueCard: () => false,
        minions: [],
        triggerCards: {},
        scenario: {},
    };
    const attachment = {
        attach: {
            target: TARGET_MINION,
        },
        getAttachConfig() {
            return this.attach;
        },
        createAttachEffect(card) {
            return new AttachEffect({
                card,
                match,
                target: this.attach.target,
            });
        },
    };
    const selectedTarget = {
        abilities: [],
        card: attachment,
        isAttachment: true,
        isEncounterCard: true,
        isMain: false,
        isMinion: false,
        isSideScheme: false,
        isTreachery: false,
        surge: true,
        async discard() {
            discarded = true;
        },
        endTriggers() {},
    };
    const effect = new RevealEncounterEffect({
        match,
        selectedTarget,
    });
    effect.applySurge = async () => {
        surgeCount++;
    };

    await effect.execute({player: {}});

    assert.equal(discarded, true);
    assert.equal(surgeCount, 1);
});

test('an attachment with a valid target enters play and attaches to it', async () => {
    let surgeCount = 0;
    const scenario = {
        gameZone: {
            addToGameZone() {},
            async refresh() {},
        },
    };
    const minion = {
        id: 'minion',
        abilities: [],
        attached: [],
        currentSide: {
            card: {hitPoints: 8},
        },
        async refresh() {},
    };
    const match = {
        isUniqueCard: () => false,
        minions: [minion],
        numPlayers: 1,
        scenario,
        triggerCards: {},
    };
    const cardsFactory = new CardsFactory({match});
    const card = cardsFactory.createCard({
        type: CARD_TYPE_ATTACHMENT,
        params: {
            attach: {
                target: TARGET_MINION,
            },
            keywords: {
                surge: true,
            },
            maxAttach: 1,
            name: 'Mejoras biomecánicas',
            set: 'the-doomsday-chair',
        },
    });
    const attachment = cardsFactory.createGameCard({
        card,
        owner: scenario,
    });
    const effect = new RevealEncounterEffect({
        match,
        selectedTarget: attachment,
    });
    effect.applySurge = async () => {
        surgeCount++;
    };

    await effect.execute({player: {}});

    assert.deepEqual(minion.attached, [attachment]);
    assert.equal(attachment.attachedTo, minion);
    assert.equal(surgeCount, 1);
});

test('nested reveals skip dealt cards already consumed by another reveal', async () => {
    const first = createEncounterCard('first');
    const second = createEncounterCard('second');
    const third = createEncounterCard('third');
    const revealed = [];
    const player = {
        encounters: [first, second, third],
        async revealEncounterCard(card) {
            revealed.push(card);
            if (card === first) {
                await this.revealEncounterCard(this.encounters.shift());
            }
        },
    };

    await Player.prototype.revealEncounterCards.call(player);

    assert.deepEqual(revealed, [first, second, third]);
    assert.deepEqual(player.encounters, []);
});
});
