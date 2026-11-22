import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_ALLY,
    CARD_TYPE_EVENT,
    DIALOG_LIST,
    DIALOG_REVEAL_CARDS,
    DIALOG_SELECT_TARGET,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_CHOOSE_CARD_TYPE,
    TARGET_ANY_DECK,
    TARGET_PARENT,
} from 'mc-shared';
import {EffectsFactory} from '../../src/factory/effects/effects-factory.js';
import basicAllies from '../../../mc-data/seed/catalog/aspects/basic/allies.js';

describe('Cosmo card configuration', () => {
    const resolveCosmo = async topCardType => {
        const discardedCard = {
            id: 'discarded-card',
            name: 'Carta descartada',
            type: topCardType,
            toObj() {
                return {
                    id: this.id,
                    name: this.name,
                    type: this.type,
                };
            },
        };
        const untouchedCard = {
            id: 'untouched-card',
            toObj() {
                return {id: this.id};
            },
        };
        const createDeck = ({id, name, cards, isPlayerDeck = false}) => ({
            id,
            name,
            cards,
            discardPile: [],
            isPlayerDeck,
            toObj() {
                return {id: this.id, name: this.name};
            },
            async discardTopCards(count) {
                const discarded = this.cards.splice(0, count);
                this.discardPile.push(...discarded);

                return discarded;
            },
            refresh() {},
        });
        const encounterDeck = createDeck({
            id: 'encounter-deck',
            name: 'Mazo de Encuentros',
            cards: [untouchedCard],
        });
        const playerDeck = createDeck({
            id: 'player-deck',
            name: 'Mazo del jugador',
            cards: [discardedCard],
            isPlayerDeck: true,
        });
        const player = {
            id: 'player-1',
            name: 'Jugador',
            deck: playerDeck,
        };
        const dialogs = [];
        const match = {
            players: [player],
            scenario: {deck: encounterDeck},
            openDialog: async dialog => {
                dialogs.push(dialog);
                if (dialog.dialogType === DIALOG_SELECT_TARGET) {
                    return {
                        selected: dialog.data.cards.find(({id}) =>
                            id === playerDeck.id),
                    };
                }
                if (dialog.dialogType === DIALOG_LIST) {
                    return {
                        selected: dialog.data.options.find(({cardType}) =>
                            cardType === CARD_TYPE_ALLY),
                    };
                }
                if (dialog.dialogType === DIALOG_REVEAL_CARDS) {
                    return {};
                }

                assert.fail(`Unexpected dialog: ${dialog.dialogType}`);
            },
        };
        const cosmo = basicAllies.find(({_id}) => _id === 'basic-cosmo');
        const effectConfig = cosmo.card.params.abilities[0].params.effect;
        const effect = new EffectsFactory({match}).parseEffect(effectConfig);
        const sourceCard = {
            name: 'Cosmo',
            toObj() {
                return {name: this.name};
            },
        };
        effect.ability = {card: sourceCard};

        const triggeredEffect = {
            ability: {
                isBasic: true,
                card: {isAlly: true},
                preventConsequentialDamage: false,
            },
        };
        const params = {match, player, triggeredEffect};
        const [chooseTypeEffect, discardEffect, checkTypeEffect] = effect.effects;

        await effect.prepare(params);
        assert.deepEqual(
            dialogs.map(({dialogType}) => dialogType),
            [DIALOG_SELECT_TARGET]
        );
        assert.equal(dialogs[0].title, 'Elige un mazo');
        assert.equal(effect.selectedTarget, playerDeck);
        assert.equal(chooseTypeEffect.selectedTarget, playerDeck);
        assert.equal(discardEffect.selectedTarget, playerDeck);

        const effectParams = effect.getEffectParams(params);
        assert.equal(await chooseTypeEffect.canRun(effectParams), true);
        assert.equal(await discardEffect.canRun(effectParams), true);
        await chooseTypeEffect.execute(effectParams);
        assert.deepEqual(
            dialogs.map(({dialogType}) => dialogType),
            [DIALOG_SELECT_TARGET, DIALOG_LIST]
        );

        await discardEffect.execute(effectParams);
        assert.deepEqual(
            dialogs.map(({dialogType}) => dialogType),
            [DIALOG_SELECT_TARGET, DIALOG_LIST, DIALOG_REVEAL_CARDS]
        );
        assert.deepEqual(
            dialogs[2].data.cards.map(({id}) => id),
            [discardedCard.id]
        );
        assert.deepEqual(playerDeck.discardPile, [discardedCard]);
        assert.deepEqual(encounterDeck.cards, [untouchedCard]);

        checkTypeEffect.effect.runEffect = async effectParams =>
            checkTypeEffect.effect.execute(effectParams);
        await checkTypeEffect.execute(effectParams);

        return {
            dialogs,
            prevented: triggeredEffect.ability.preventConsequentialDamage,
        };
    };

    test('chooses a deck before the type, reveals its top card, and prevents matching consequential damage', async () => {
        const {dialogs, prevented} = await resolveCosmo(CARD_TYPE_ALLY);

        assert.deepEqual(
            dialogs.map(({dialogType}) => dialogType),
            [DIALOG_SELECT_TARGET, DIALOG_LIST, DIALOG_REVEAL_CARDS]
        );
        assert.equal(prevented, true);
    });

    test('does not prevent consequential damage when the discarded type does not match', async () => {
        const {prevented} = await resolveCosmo(CARD_TYPE_EVENT);

        assert.equal(prevented, false);
    });

    test('configures Cosmo to select a deck and reveal the discarded card', () => {
        const cosmo = basicAllies.find(({_id}) => _id === 'basic-cosmo');
        const effects = cosmo.card.params.abilities[0].params.effect.params.effects;
        const discardEffect = effects[1];

        assert.equal(
            cosmo.card.params.abilities[0].params.effect.params.target,
            TARGET_ANY_DECK
        );
        assert.equal(effects[0].type, EFFECT_CHOOSE_CARD_TYPE);
        assert.equal(effects[0].params.target, TARGET_PARENT);
        assert.equal(discardEffect.type, EFFECT_DISCARD_FROM_DECK);
        assert.equal(discardEffect.params.target, TARGET_PARENT);
        assert.equal(discardEffect.params.count, 1);
        assert.equal(discardEffect.params.showDialog, true);
    });
});
