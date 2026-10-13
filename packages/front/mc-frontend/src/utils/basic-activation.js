import {ABILITY_ID} from '../misc/utils.js';
import {MENU_OPTION_VIEW_TUCKED_CARDS} from '../misc/card-menu.js';

export const BASIC_ACTIVATION_OPTION_PREFIX = 'basic-activation-';

const ACTIVATION_NAMES = {
    attack: 'Ataque básico',
    thwart: 'Intervención básica',
};

export function getBasicActivationOption(player, card, type) {
    if (!card?.id || !ACTIVATION_NAMES[type]) {
        return undefined;
    }

    const targetIds = [card.id, card.parentId].filter(Boolean);
    const abilities = player?.superhero?.abilities || [];
    const ability = abilities.find(candidate =>
        candidate.isBasic &&
        candidate[type === 'attack' ? 'isAttack' : 'isThwart'] &&
        !candidate.disable &&
        (candidate.availableTargetIds || []).some(id => targetIds.includes(id))
    );

    if (!ability) {
        return undefined;
    }

    const abilityIndex = abilities.indexOf(ability);
    const targetId = ability.availableTargetIds.find(id =>
        targetIds.includes(id)
    );

    return {
        id: `${BASIC_ACTIVATION_OPTION_PREFIX}${ability.index ?? abilityIndex}`,
        text: ACTIVATION_NAMES[type],
        basicActivation: true,
        abilityIndex: ability.index ?? abilityIndex,
        targetId,
        activationType: type,
    };
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
