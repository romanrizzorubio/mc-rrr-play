import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_ALLY,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_HERO,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_VILLAIN,
    CARD_TYPES,
    DIALOG_LIST,
} from 'mc-shared';
import {ChooseCardTypeEffect} from '../../src/effects/choose-card-type-effect.js';

describe('ChooseCardTypeEffect', () => {
    test('offers selectable shared types and exposes the selected type', async () => {
        const excludedCardTypes = [
            CARD_TYPE_ALTEREGO,
            CARD_TYPE_HERO,
            CARD_TYPE_MAIN_SCHEME_A_CARD,
            CARD_TYPE_MAIN_SCHEME_B_CARD,
            CARD_TYPE_VILLAIN,
        ];
        const excludedCardTypeSet = new Set(excludedCardTypes);
        const selectableCardTypes = CARD_TYPES.filter(
            cardType => !excludedCardTypeSet.has(cardType)
        );
        const card = {
            toObj() {
                return {name: 'Cosmo'};
            },
        };
        const effect = new ChooseCardTypeEffect({
            ability: {card},
            excludeCardTypes: excludedCardTypes,
        });
        const params = {
            player: {
                id: 'player-1',
                name: 'Player 1',
            },
        };
        let dialog;
        effect.openDialog = async value => {
            dialog = value;

            return {
                selected: {
                    id: selectableCardTypes.indexOf(CARD_TYPE_ALLY),
                    cardType: CARD_TYPE_ALLY,
                },
            };
        };

        await effect.execute(params);

        assert.equal(dialog.dialogType, DIALOG_LIST);
        assert.equal(dialog.data.cardTypeOptions, true);
        assert.deepEqual(
            dialog.data.options.map(({cardType}) => cardType),
            selectableCardTypes
        );
        assert.ok(dialog.data.options.every(({cardType}) =>
            !excludedCardTypeSet.has(cardType)));
        assert.equal(effect.selectedType, CARD_TYPE_ALLY);
        assert.equal(params.namedCardType, CARD_TYPE_ALLY);
    });

    test('rejects a selection that does not match the selectable type list', async () => {
        const effect = new ChooseCardTypeEffect({
            ability: {
                card: {
                    toObj() {
                        return {name: 'Cosmo'};
                    },
                },
            },
        });
        effect.openDialog = async () => ({
            selected: {id: 0, cardType: 'not-a-card-type'},
        });

        await assert.rejects(
            effect.execute({
                player: {id: 'player-1', name: 'Player 1'},
            }),
            /invalid card type selection/
        );
    });

    test('rejects a shared type excluded from the selectable list', async () => {
        const effect = new ChooseCardTypeEffect({
            excludeCardTypes: [CARD_TYPE_VILLAIN],
            ability: {
                card: {
                    toObj() {
                        return {name: 'Cosmo'};
                    },
                },
            },
        });
        effect.openDialog = async () => ({
            selected: {
                id: CARD_TYPES.indexOf(CARD_TYPE_VILLAIN),
                cardType: CARD_TYPE_VILLAIN,
            },
        });

        await assert.rejects(
            effect.execute({
                player: {id: 'player-1', name: 'Player 1'},
            }),
            /invalid card type selection/
        );
    });

    test('offers every shared type when no exclusions are configured', async () => {
        const effect = new ChooseCardTypeEffect({
            ability: {
                card: {
                    toObj() {
                        return {name: 'Cosmo'};
                    },
                },
            },
        });
        effect.openDialog = async dialog => {
            assert.deepEqual(
                dialog.data.options.map(({cardType}) => cardType),
                CARD_TYPES
            );

            return {
                selected: {
                    id: 0,
                    cardType: CARD_TYPES[0],
                },
            };
        };

        await effect.execute({
            player: {id: 'player-1', name: 'Player 1'},
        });
    });
});
