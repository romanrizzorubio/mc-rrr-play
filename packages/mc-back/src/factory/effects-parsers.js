import {
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_CHOOSE,
    EFFECT_DELAYED,
    EFFECT_DO_IF_CARD_GAME,
    EFFECT_DO_IF,
    EFFECT_DO_IF_HAS_DAMAGE,
    EFFECT_DO_IF_HAS_PAID,
    EFFECT_DO_IF_HAS_TRAITS,
    EFFECT_DO_IF_TAKE_DAMAGE,
    EFFECT_LASTING,
    EFFECT_MAY,
} from '../constants/effects.js';

export const EFFECT_PARSERS_MAP = {
    [EFFECT_CHAINED]: '_parseChained',
    [EFFECT_CHOOSE]: '_parseChoose',
    [EFFECT_CHOOSE_ABILITY]: '_parseChooseAbility',
    [EFFECT_MAY]: '_parseMay',
    [EFFECT_DO_IF]: '_parseDoIf',
    [EFFECT_DO_IF_CARD_GAME]: '_parseDoIf',
    [EFFECT_DO_IF_HAS_DAMAGE]: '_parseDoIf',
    [EFFECT_DO_IF_HAS_PAID]: '_parseDoIf',
    [EFFECT_DO_IF_HAS_TRAITS]: '_parseDoIf',
    [EFFECT_DO_IF_TAKE_DAMAGE]: '_parseDoIf',
    [EFFECT_DELAYED]: '_parseDelayed',
    [EFFECT_LASTING]: '_parseLasting',
};
