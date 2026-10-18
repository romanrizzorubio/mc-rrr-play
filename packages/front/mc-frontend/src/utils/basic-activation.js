import {ABILITY_ID} from '../misc/utils.js';
import {MENU_OPTION_VIEW_TUCKED_CARDS} from '../misc/card-menu.js';

export const BASIC_ACTIVATION_OPTION_PREFIX = 'basic-activation-';

const ACTIVATION_NAMES = {
    attack: 'Ataque básico',
    thwart: 'Intervención básica',
};

export function getActivationOptionsForActor(actor) {
    return (actor?.abilities || []).reduce((options, ability, index) => {
        const activationType = ability.isAttack ?
            'attack' :
            ability.isThwart ? 'thwart' : undefined;
        const availableTargetIds = ability.availableTargetIds;

        if (
            (!ability.isBasic && !ability.isAction) ||
            ability.disable ||
            (!ability.isAction && !activationType) ||
            !Array.isArray(availableTargetIds) ||
            !availableTargetIds.length
        ) {
            return options;
        }

        const abilityIndex = ability.index ?? index;

        options.push({
            id: `${ability.isBasic ?
                BASIC_ACTIVATION_OPTION_PREFIX :
                ABILITY_ID}${abilityIndex}`,
            text: ability.isBasic ?
                ACTIVATION_NAMES[activationType] :
                ability.name,
            ...(ability.isBasic ? {basicActivation: true} : {}),
            abilityIndex,
            ...(activationType ? {activationType} : {}),
            availableTargetIds,
        });

        return options;
    }, []);
}

export function getBasicActivationOptionsForActor(actor) {
    return getActivationOptionsForActor(actor)
        .filter(option => option.basicActivation);
}

function findActivationOption(options, card, type) {
    if (!card?.id || (type && !ACTIVATION_NAMES[type])) {
        return undefined;
    }

    const targetIds = [card.id, card.parentId].filter(Boolean);
    const option = options.find(candidate =>
        (!type || candidate.activationType === type) &&
        candidate.availableTargetIds.some(id => targetIds.includes(id))
    );

    if (!option) {
        return undefined;
    }

    const targetId = option.availableTargetIds.find(id =>
        targetIds.includes(id)
    );

    return {
        id: option.id,
        text: option.text,
        ...(option.basicActivation ? {basicActivation: true} : {}),
        abilityIndex: option.abilityIndex,
        targetId,
        ...(option.activationType ? {
            activationType: option.activationType,
        } : {}),
    };
}

export function getActivationOptionForActor(actor, card, type) {
    return findActivationOption(
        getActivationOptionsForActor(actor),
        card,
        type
    );
}

export function getBasicActivationOptionForActor(actor, card, type) {
    return findActivationOption(
        getBasicActivationOptionsForActor(actor),
        card,
        type
    );
}

export function getBasicActivationOption(player, card, type) {
    return getBasicActivationOptionForActor(player?.superhero, card, type);
}

export function getCardAbilityOptions(card) {
    return (card?.abilities || []).reduce((options, ability, index) => {
        if (!ability.isAction && !ability.isBasic) {
            return options;
        }

        const abilityIndex = ability.index ?? index;

        options.push({
            id: `${ABILITY_ID}${abilityIndex}`,
            text: ability.name,
            disable: ability.disable,
        });

        return options;
    }, []);
}

export function hasAvailableCardAction(card) {
    return getCardAbilityOptions(card).some(option => !option.disable);
}

export function isTargetClickDisabled(card, player, activationType) {
    return Boolean(
        ACTIVATION_NAMES[activationType] &&
        !getBasicActivationOption(player, card, activationType) &&
        !hasAvailableCardAction(card) &&
        !card?.tuckedCards?.length
    );
}

export function getTargetMenuOptions(
    card,
    basicActivation,
    abilityOptions = getCardAbilityOptions(card),
    showAvailableActions = false
) {
    const tuckedCards = card?.tuckedCards || [];
    const hasAvailableAbility = abilityOptions.some(option => !option.disable);
    const tuckedCardsOption = {
        id: MENU_OPTION_VIEW_TUCKED_CARDS,
        text: 'Ver cartas metidas debajo',
    };

    if (basicActivation && (hasAvailableAbility || tuckedCards.length)) {
        return [
            basicActivation,
            ...abilityOptions,
            ...(tuckedCards.length ? [tuckedCardsOption] : []),
        ];
    }
    if (showAvailableActions && hasAvailableAbility) {
        return [
            ...(basicActivation ? [basicActivation] : []),
            ...abilityOptions,
            ...(tuckedCards.length ? [tuckedCardsOption] : []),
        ];
    }
    if (basicActivation) {
        return [];
    }
    if (tuckedCards.length && abilityOptions.length) {
        return [...abilityOptions, tuckedCardsOption];
    }
    if (abilityOptions.length > 1) {
        return abilityOptions;
    }

    return [];
}
