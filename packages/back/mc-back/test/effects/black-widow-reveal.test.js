import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_ANY,
    CARD_TYPE_TREACHERY,
    EFFECT_CANCEL_ENCOUNTER,
    EFFECT_CHAINED,
    EFFECT_EXHAUST,
    EFFECT_GET_ENCOUNTER_CARD,
    EFFECT_REVEAL_ENCOUNTER,
    PLACE_ENCOUNTER_DECK,
    PRIORITY_INTERRUPT,
    TARGET_EFFECT,
    TARGET_THIS,
    TRIGGER_ENCOUNTER_REVEAL,
    TRIGGER_TREACHERY_REVEAL,
} from 'mc-shared';
import basicEvents from '../../../mc-data/seed/catalog/aspects/basic/events.js';
import justiceUpgrades from '../../../mc-data/seed/catalog/aspects/justice/upgrades.js';
import protectionEvents from '../../../mc-data/seed/catalog/aspects/protection/events.js';
import scarletWitch from '../../../mc-data/seed/catalog/heroes/scarlet-witch.js';
import {
    CANCEL_ENCOUNTER_FULL,
    CANCEL_ENCOUNTER_NOT,
    CANCEL_ENCOUNTER_REVEAL,
    CancelEncounterEffect,
} from '../../src/effects/cancel-encounter-effect.js';
import {AbilitiesFactory} from '../../src/factory/abilities/abilities-factory.js';
import {Engine} from '../../src/engine/engine.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {GameCard} from '../../src/model/cards/game-card.js';
import {TRIGGER_MAP} from '../../src/factory/triggers/triggers-map.js';
import {EncounterRevealTrigger} from '../../src/triggers/encounter-reveal-trigger.js';
import {TreacheryRevealTrigger} from '../../src/triggers/treachery-reveal-trigger.js';
import blackWidow from '../../../mc-data/seed/catalog/heroes/black-widow.js';
import doctorStrange from '../../../mc-data/seed/catalog/heroes/doctor-strange.js';
import protectionAllies from '../../../mc-data/seed/catalog/aspects/protection/allies.js';
import spiderman from '../../../mc-data/seed/catalog/heroes/spiderman.js';

describe('Encounter reveal cancellation', () => {
    test('encounter cancellation cards explicitly configure their card type', () => {
        const configurations = [
            {
                entries: justiceUpgrades,
                name: 'Tácticas de infiltración',
                type: CARD_TYPE_ANY,
            },
            {
                entries: protectionAllies,
                name: 'Viuda Negra',
                type: CARD_TYPE_ANY,
            },
            {
                entries: protectionEvents,
                name: '¡Poneos detrás de mí!',
                type: CARD_TYPE_TREACHERY,
            },
            {
                entries: basicEvents,
                name: 'Orden y caos',
                type: CARD_TYPE_TREACHERY,
            },
            {
                entries: scarletWitch.config.cards,
                name: 'Alterar la realidad',
                type: CARD_TYPE_ANY,
            },
            {
                entries: doctorStrange.config.cards,
                name: 'Salvaguarda arcana',
                type: CARD_TYPE_TREACHERY,
            },
            {
                entries: spiderman.config.cards,
                name: 'Sentido Arácnido Mejorado',
                type: CARD_TYPE_TREACHERY,
            },
            {
                entries: blackWidow.config.cards,
                name: 'Gancho de escalada',
                type: CARD_TYPE_TREACHERY,
            },
        ];
        const findCancelConfig = value => {
            if (!value || typeof value !== 'object') {
                return undefined;
            }
            if (value.type === EFFECT_CANCEL_ENCOUNTER) {
                return value;
            }

            for (const child of Object.values(value)) {
                const config = findCancelConfig(child);
                if (config) {
                    return config;
                }
            }

            return undefined;
        };

        for (const {entries, name, type} of configurations) {
            const entry = entries.find(({card}) => card.params.name === name);
            assert.ok(entry, name);

            const cancelConfig = findCancelConfig(entry.card.params.abilities);
            assert.ok(cancelConfig, name);
            assert.equal(cancelConfig.params.type, type, name);
        }
    });

    test('Black Widow cancels any revealed encounter card and reveals the next one', () => {
        const blackWidow = protectionAllies.find(({_id}) =>
            _id === 'protection-viuda-negra');

        assert.ok(blackWidow);
        const [ability] = blackWidow.card.params.abilities;
        const [exhaustCost] = ability.params.arrow.params.effects;
        const effects = ability.params.effect.params.effects;
        const replacementRevealConfig = effects[0].params.thenEffect;
        const revealEffect = new RevealEncounterEffect({match: {}});

        assert.equal(exhaustCost.type, EFFECT_EXHAUST);
        assert.equal(exhaustCost.params.target, TARGET_THIS);
        assert.equal(ability.params.trigger, TRIGGER_ENCOUNTER_REVEAL);
        assert.equal(TRIGGER_MAP[TRIGGER_ENCOUNTER_REVEAL], EncounterRevealTrigger);
        assert.deepEqual(revealEffect.getTriggersInit(), [
            TRIGGER_ENCOUNTER_REVEAL,
            TRIGGER_TREACHERY_REVEAL,
        ]);
        assert.deepEqual(effects.map(({type}) => type), [
            EFFECT_CANCEL_ENCOUNTER,
        ]);
        assert.equal(effects[0].params.type, CARD_TYPE_ANY);
        assert.equal(replacementRevealConfig.type, EFFECT_CHAINED);
        assert.deepEqual(
            replacementRevealConfig.params.effects.map(({type}) => type),
            [EFFECT_GET_ENCOUNTER_CARD, EFFECT_REVEAL_ENCOUNTER]
        );
        assert.equal(
            replacementRevealConfig.params.effects[0].params.from,
            PLACE_ENCOUNTER_DECK
        );
    });

    test('Black Widow is not offered again while exhausted during the replacement reveal', async () => {
        const blackWidowData = protectionAllies.find(({_id}) =>
            _id === 'protection-viuda-negra');
        const [abilityConfig] = blackWidowData.card.params.abilities;
        const player = {
            hand: {cards: []},
            isPlayer: true,
            async getCardsToPay() {
                return {generators: [], hand: [{}]};
            },
        };
        const blackWidow = {controller: player, exhausted: true};
        const ability = new AbilitiesFactory({
            match: {
                triggerCards: {},
            },
        }).createAbility(abilityConfig);
        const revealedCard = {isEncounterCard: true, isTreachery: false};
        const params = {
            card: revealedCard,
            player,
            effect: {
                selectedTarget: revealedCard,
                canceled: CANCEL_ENCOUNTER_NOT,
            },
        };
        ability.card = blackWidow;

        assert.equal(await ability.canTrigger(params), false);

        blackWidow.exhausted = false;
        assert.equal(await ability.canTrigger(params), true);
    });

    test('treachery cancellation cards are not offered after the reveal is canceled', async () => {
        const cancellationCards = [
            {
                hero: doctorStrange,
                name: 'Salvaguarda arcana',
                canceled: CANCEL_ENCOUNTER_FULL,
            },
            {
                hero: spiderman,
                name: 'Sentido Arácnido Mejorado',
                canceled: CANCEL_ENCOUNTER_REVEAL,
            },
            {
                hero: blackWidow,
                name: 'Gancho de escalada',
                canceled: CANCEL_ENCOUNTER_FULL,
            },
        ];

        for (const {hero, name, canceled} of cancellationCards) {
            const match = {
                triggerCards: {},
                openDialog: async ({data}) => ({
                    selected: data.cards[0],
                }),
            };
            const player = {
                hand: {cards: []},
                isHero: true,
                isPlayer: true,
            };
            const abilityFactory = new AbilitiesFactory({match});
            const cardConfig = hero.config.cards.find(({card}) =>
                card.params.name === name
            ).card.params;
            const createTrigger = index => {
                const ability = abilityFactory.createAbility(cardConfig.abilities[0]);
                const card = {
                    id: `${name}-${index}`,
                    isEvent: true,
                    name,
                    owner: player,
                    toObj() {
                        return {id: this.id, name: this.name};
                    },
                };
                ability.card = card;

                return new TreacheryRevealTrigger({
                    ability,
                    card,
                    trigger: cardConfig.abilities[0].params.trigger,
                });
            };
            const triggers = [createTrigger(1), createTrigger(2)];
            player.hand.cards = triggers.map(trigger => trigger.card);
            let plays = 0;
            player.triggerEvent = async (trigger, params) => {
                plays++;
                await trigger.ability.resolveAbility({
                    ...params,
                    arrowPaid: true,
                    card: trigger.card,
                    player,
                });

                return {
                    paymentCancelled: false,
                    triggered: trigger.ability.resolved,
                };
            };

            const reveal = new RevealEncounterEffect({match});
            reveal.selectedTarget = {
                isEncounterCard: true,
                isTreachery: true,
            };
            const engine = new Engine();
            engine.match = match;

            await engine.trigger(
                PRIORITY_INTERRUPT,
                [TRIGGER_TREACHERY_REVEAL],
                {
                    arrowPaid: true,
                    effect: reveal,
                    player,
                },
                triggers
            );

            assert.equal(triggers[0].ability.effect.target, TARGET_EFFECT, name);
            assert.equal(plays, 1, name);
            assert.equal(reveal.canceled, canceled, name);
        }
    });

    test('encounter reveal trigger accepts non-treachery encounter cards only', () => {
        const trigger = new EncounterRevealTrigger({
            ability: {
                canTrigger: () => true,
            },
        });

        assert.equal(trigger.canTrigger({
            effect: {
                selectedTarget: {
                    isEncounterCard: true,
                    isTreachery: false,
                },
            },
        }), true);
        assert.equal(trigger.canTrigger({
            effect: {
                selectedTarget: {
                    isEncounterCard: false,
                    isTreachery: false,
                },
            },
        }), false);
    });

    test('treachery reveal trigger ignores a reveal without a selected target', () => {
        const trigger = new TreacheryRevealTrigger({
            ability: {
                canTrigger: () => true,
            },
        });

        assert.equal(trigger.canTrigger({
            effect: {
                canceled: CANCEL_ENCOUNTER_NOT,
            },
        }), false);
        assert.equal(trigger.canTrigger({}), false);
    });

    test('cancel encounter defaults to any encounter card and can be restricted to treacheries', () => {
        const cancelAnyEncounter = new CancelEncounterEffect({});
        const cancelTreachery = new CancelEncounterEffect({
            type: CARD_TYPE_TREACHERY,
        });
        const treachery = {isEncounterCard: true, isTreachery: true};
        const minion = {isEncounterCard: true, isTreachery: false};
        const playerCard = {isEncounterCard: false, isTreachery: false};

        assert.equal(cancelAnyEncounter.matchType(treachery), true);
        assert.equal(cancelAnyEncounter.matchType(minion), true);
        assert.equal(cancelAnyEncounter.matchType(playerCard), false);
        assert.equal(cancelTreachery.matchType(treachery), true);
        assert.equal(cancelTreachery.matchType(minion), false);
    });

    test('cancel encounter cannot cancel permanent, villain, or main scheme reveals', () => {
        const cancelAnyEncounter = new CancelEncounterEffect({type: CARD_TYPE_ANY});
        const protectedCards = [
            new GameCard({
                card: {id: 'villain', isEncounterCard: true, isVillain: true},
            }),
            new GameCard({
                card: {id: 'main-scheme', isEncounterCard: true, isMainScheme: true},
            }),
            new GameCard({
                card: {
                    id: 'permanent',
                    isEncounterCard: true,
                    keywords: {permanent: true},
                },
            }),
        ];

        for (const selectedTarget of protectedCards) {
            assert.equal(selectedTarget.hasUncancellableAbilities, true);
            assert.equal(cancelAnyEncounter.canRun({
                effect: {
                    canceled: CANCEL_ENCOUNTER_NOT,
                    selectedTarget,
                },
            }), false);
        }

        assert.equal(cancelAnyEncounter.canRun({
            effect: {
                canceled: CANCEL_ENCOUNTER_NOT,
                selectedTarget: new GameCard({
                    card: {id: 'encounter-card', isEncounterCard: true},
                }),
            },
        }), true);
    });

    test('uncancellable abilities are derived from card rules, not card configuration', () => {
        const configuredOnly = new GameCard({
            card: {
                id: 'configured-uncancellable',
                hasUncancellableAbilities: true,
                isEncounterCard: true,
            },
        });
        const configuredFalseVillain = new GameCard({
            card: {
                id: 'configured-cancellable-villain',
                hasUncancellableAbilities: false,
                isVillain: true,
            },
        });
        const cancelAnyEncounter = new CancelEncounterEffect({type: CARD_TYPE_ANY});

        assert.equal(configuredOnly.hasUncancellableAbilities, false);
        assert.equal(configuredFalseVillain.hasUncancellableAbilities, true);
        assert.equal(cancelAnyEncounter.canRun({
            effect: {
                canceled: CANCEL_ENCOUNTER_NOT,
                selectedTarget: configuredOnly,
            },
        }), true);
        assert.equal(cancelAnyEncounter.canRun({
            effect: {
                canceled: CANCEL_ENCOUNTER_NOT,
                selectedTarget: configuredFalseVillain,
            },
        }), false);
    });

    test('uncancellable abilities follow the current side of a double-sided card', () => {
        const regularSide = new GameCard({card: {id: 'regular-side'}});
        const permanentSide = new GameCard({
            card: {id: 'permanent-side', keywords: {permanent: true}},
        });
        const doubleSidedCard = new GameCard({
            sides: [regularSide, permanentSide],
        });

        assert.equal(doubleSidedCard.hasUncancellableAbilities, false);

        doubleSidedCard.selectedSide = 1;

        assert.equal(doubleSidedCard.hasUncancellableAbilities, true);
    });
});
