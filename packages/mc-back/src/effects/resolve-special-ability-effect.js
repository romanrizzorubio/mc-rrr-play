import {
    DIALOG_LIST,
    DIALOG_SELECT_CARD,
    PLACE_IN_PLAY,
} from 'mc-shared';
import {SpecialAbility} from '../abilities/misc/special-ability.js';
import {checkCondition} from '../engine/utils.js';

import {Effect} from './effect.js';

const SELECT_SPECIAL_ABILITY_TITLE = '¿Qué capacidad especial quieres resolver?';

export class ResolveSpecialAbilityEffect extends Effect {
    constructor({
        locations = [PLACE_IN_PLAY],
        filter = {},
        resolveAll = false,
    }) {
        super(arguments[0]);
        this.locations = locations;
        this.filter = filter;
        this.resolveAll = resolveAll;
    }

    async getAvailableAbilities(params, resolvedCards, isLastStep) {
        const {player} = params;
        const available = [];
        const abilityParams = {
            ...params,
            isLastStep,
        };

        for (const location of this.locations) {
            let cards = [];
            if (location === PLACE_IN_PLAY) {
                cards = player.gameZone.cards;
            }
            // Podríamos añadir más localizaciones si fuera necesario

            for (const gameCard of cards) {
                if (resolvedCards.has(gameCard) ||
                    !checkCondition(gameCard.card, this.filter)) {
                    continue;
                }

                const ability = gameCard.abilities.find(candidate =>
                    candidate instanceof SpecialAbility);
                if (!ability) {
                    continue;
                }

                ability.prepareEffect();
                if (await ability.canRun(abilityParams)) {
                    available.push({gameCard, ability});
                }
            }
        }

        return available;
    }

    async selectAbility(available, closeOnResponse) {
        let selectedIndex;
        if (available.length > 5) {
            const response = await this.openDialog({
                closeOnResponse,
                dialogType: DIALOG_LIST,
                hideOk: true,
                title: SELECT_SPECIAL_ABILITY_TITLE,
                data: {
                    options: available.map(({gameCard}, index) => ({
                        id: index,
                        text: gameCard.card.name,
                    })),
                },
            });
            selectedIndex = response?.selected?.id;
        } else {
            const response = await this.openDialog({
                closeOnResponse,
                dialogType: DIALOG_SELECT_CARD,
                hideOk: true,
                title: SELECT_SPECIAL_ABILITY_TITLE,
                data: {
                    cards: available.map(({gameCard}) => gameCard.toObj()),
                },
            });
            const selectedId = response?.selected?.[0]?.id;
            selectedIndex = available.findIndex(({gameCard}) =>
                gameCard.id === selectedId);
        }

        if (!Number.isInteger(selectedIndex) ||
            selectedIndex < 0 ||
            selectedIndex >= available.length) {
            throw new Error('La selección de la capacidad especial no es válida.');
        }

        return available[selectedIndex];
    }

    async execute(params) {
        const resolvedCards = new Set();

        while (true) {
            let isLastStep = !this.resolveAll;
            let available = await this.getAvailableAbilities(
                params,
                resolvedCards,
                isLastStep
            );
            if (available.length === 0) {
                return;
            }

            if (this.resolveAll && available.length === 1) {
                const lastStepAvailable = await this.getAvailableAbilities(
                    params,
                    resolvedCards,
                    true
                );
                if (lastStepAvailable.length === 0) {
                    return;
                }
                if (lastStepAvailable.length === 1) {
                    available = lastStepAvailable;
                    isLastStep = true;
                }
            }

            const selected = await this.selectAbility(available, isLastStep);

            await selected.ability.resolveAbility({
                ...params,
                isLastStep,
            });
            resolvedCards.add(selected.gameCard);

            if (!this.resolveAll) {
                return;
            }
        }
    }
}
