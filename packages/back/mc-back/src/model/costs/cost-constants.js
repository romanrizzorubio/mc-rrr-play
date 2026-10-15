import {
    EFFECT_CHAINED,
    EFFECT_CHOOSE,
    EFFECT_DELAYED,
    EFFECT_DO_IF,
    EFFECT_DO_IF_CARD_GAME,
    EFFECT_DO_IF_HAS_DAMAGE,
    EFFECT_DO_IF_HAS_PAID,
    EFFECT_DO_IF_HAS_TRAITS,
    EFFECT_DO_IF_TARGET,
    EFFECT_DO_IF_TAKE_DAMAGE,
    EFFECT_LASTING,
    EFFECT_MAY,
    EFFECT_REPLACE_EFFECT,
    EFFECT_SIMULTANEOUS,
} from 'mc-shared';

export const COST_TYPE_ABILITY = 'ability';
export const COST_TYPE_ADDITIONAL = 'additional';
export const COST_TYPE_ARROW = 'arrow';
export const COST_TYPE_BASIC_ACTIVATION = 'basic-activation';
export const COST_TYPE_RESOURCE = 'resource';

export const EFFECT_CHILD_KEYS = {
    [EFFECT_CHAINED]: ['effects'],
    [EFFECT_CHOOSE]: ['options'],
    [EFFECT_DELAYED]: ['effect'],
    [EFFECT_DO_IF]: ['effect', 'effectNot'],
    [EFFECT_DO_IF_CARD_GAME]: ['effect', 'effectNot'],
    [EFFECT_DO_IF_HAS_DAMAGE]: ['effect', 'effectNot'],
    [EFFECT_DO_IF_HAS_PAID]: ['effect', 'effectNot'],
    [EFFECT_DO_IF_HAS_TRAITS]: ['effect', 'effectNot'],
    [EFFECT_DO_IF_TARGET]: ['effect', 'effectNot'],
    [EFFECT_DO_IF_TAKE_DAMAGE]: ['effect', 'effectNot'],
    [EFFECT_LASTING]: ['effect', 'endEffect'],
    [EFFECT_MAY]: ['effect'],
    [EFFECT_REPLACE_EFFECT]: ['replacement'],
    [EFFECT_SIMULTANEOUS]: ['effects'],
};

export const EFFECT_COMMON_CHILD_KEYS = ['thenEffect'];
