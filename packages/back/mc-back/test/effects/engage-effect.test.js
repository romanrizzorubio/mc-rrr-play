import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
    DIALOG_ENCOUNTERS_REVEAL,
    TARGET_YOU,
    TRIGGER_ENGAGE_HERO,
    TRIGGER_MINION_ENTER_PLAY,
    TRIGGER_THIS_ENTER_PLAY,
} from 'mc-shared';

import {EngageEffect} from '../../src/effects/engage-effect.js';

const createPlayer = () => ({
    gameZone: {
        minions: [],
        engage(minion) {
            this.minions.push(minion);
        },
        removeEngaged(minion) {
            const index = this.minions.indexOf(minion);
            if (index > -1) {
                this.minions.splice(index, 1);
            }
        },
    },
    engage(minion) {
        this.gameZone.engage(minion);
    },
    removeEngaged(minion) {
        this.gameZone.removeEngaged(minion);
    },
    async refresh() {},
});

const createScenarioDeck = (location, card) => {
    const deck = {
        isScenarioDeck: true,
        cards: location === 'deck' ? [card] : [],
        discardPile: location === 'discardPile' ? [card] : [],
        removeCardFromDeck(cardToRemove) {
            this.cards = this.cards.filter(candidate => candidate !== cardToRemove);
        },
        searchDiscard(cardToRemove) {
            this.discardPile = this.discardPile.filter(candidate => candidate !== cardToRemove);
        },
        async refresh() {},
    };

    return deck;
};

for (const location of ['deck', 'discardPile']) {
    test(`EngageEffect moves a searched minion from the encounter ${location} into play`, async () => {
        const card = {
            damage: 2,
            isMinion: true,
            get isInPlay() {
                return Boolean(this.controller);
            },
            isPlayerCard: false,
            name: 'Esclavo duende',
            async initTriggers() {},
            toObj() {
                return {name: this.name};
            },
        };
        const scenario = {deck: createScenarioDeck(location, card)};
        card.owner = scenario;
        const dialogs = [];

        const player = {
            gameZone: {
                minions: [],
                engage(minion) {
                    this.minions.push(minion);
                },
            },
            engage(minion) {
                this.gameZone.engage(minion);
            },
            async refresh() {},
        };
        const effect = new EngageEffect({
            match: {
                scenario,
                async openDialog(dialog) {
                    dialogs.push(dialog);
                },
            },
        });
        effect.selectedTarget = player;

        await effect.execute({player, selectedCard: card});

        assert.equal(scenario.deck.cards.includes(card), false);
        assert.equal(scenario.deck.discardPile.includes(card), false);
        assert.deepEqual(player.gameZone.minions, [card]);
        assert.equal(card.controller, player);
        assert.equal(card.engaged, player);
        assert.equal(card.damage, 0);
        assert.deepEqual(dialogs, [{
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: 'Esbirro puesto en juego',
            data: {
                card: {name: 'Esclavo duende'},
            },
        }]);
    });
}

test('EngageEffect does not re-engage a minion with its current player', async () => {
    const player = createPlayer();
    const minion = {
        engaged: player,
        isInPlay: true,
        isMinion: true,
    };
    player.engage(minion);
    const triggerCalls = [];
    const match = {};
    const effect = new EngageEffect({
        cardSource: 'effects.0.selectedTarget',
        match,
        selectedTarget: player,
        target: TARGET_YOU,
    });
    effect.trigger = async (priority, triggerTypes) => {
        triggerCalls.push({priority, triggerTypes});

        return true;
    };

    const params = {
        effects: [{selectedTarget: minion}],
        match,
        player,
    };
    assert.equal(await effect.canRun(params), false);
    await effect.runEffect(params);

    const triggeredTypes = triggerCalls.flatMap(({triggerTypes}) =>
        Array.isArray(triggerTypes) ? triggerTypes : [triggerTypes]);
    assert.equal(effect.resolved, false);
    assert.deepEqual(player.gameZone.minions, [minion]);
    assert.equal(triggeredTypes.includes(TRIGGER_ENGAGE_HERO), false);
});

test('EngageEffect triggers engagement, but not enter-play, when changing players', async () => {
    const previousPlayer = createPlayer();
    const player = createPlayer();
    const minion = {
        controller: previousPlayer,
        engaged: previousPlayer,
        isInPlay: true,
        isMinion: true,
    };
    previousPlayer.engage(minion);
    const triggerCalls = [];
    const match = {};
    const effect = new EngageEffect({
        cardSource: 'effects.0.selectedTarget',
        match,
        selectedTarget: player,
        target: TARGET_YOU,
    });
    effect.trigger = async (priority, triggerTypes) => {
        triggerCalls.push({priority, triggerTypes});

        return true;
    };

    const params = {
        effects: [{selectedTarget: minion}],
        match,
        player,
    };
    assert.equal(await effect.canRun(params), true);
    await effect.runEffect(params);

    const triggeredTypes = triggerCalls.flatMap(({triggerTypes}) =>
        Array.isArray(triggerTypes) ? triggerTypes : [triggerTypes]);
    assert.deepEqual(previousPlayer.gameZone.minions, []);
    assert.deepEqual(player.gameZone.minions, [minion]);
    assert.equal(minion.controller, player);
    assert.equal(minion.engaged, player);
    assert.equal(triggeredTypes.includes(TRIGGER_ENGAGE_HERO), true);
    assert.equal(triggeredTypes.includes(TRIGGER_THIS_ENTER_PLAY), false);
    assert.equal(triggeredTypes.includes(TRIGGER_MINION_ENTER_PLAY), false);
});
