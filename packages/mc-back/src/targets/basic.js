import {path} from '../engine/utils.js';
import {
    TARGET_ACTIVATION,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_EFFECT_PLAY_CARD,
    TARGET_PLAYER,
    TARGET_ROUND,
    TARGET_SCENARIO,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_YOU,
} from '../constants/targets.js';

export const basicTargets = {
    [TARGET_ACTIVATION]: ({activation}) => [activation],
    [TARGET_CARD]: ({card}) => [card],
    [TARGET_EFFECT]: ({effect}) => [effect],
    [TARGET_EFFECT_PLAY_CARD]: ({playCardEffect}) => [playCardEffect],
    [TARGET_PLAYER]: ({player}) => [player],
    [TARGET_ROUND]: ({currentRound}) => [currentRound],
    [TARGET_SCENARIO]: ({match}) => [match.scenario],
    [TARGET_SOURCE]: ({params, source}) => path(params, source),
    [TARGET_THIS]: ({ability}) => [path(ability, 'card')],
    [TARGET_YOU]: ({player}) => [player],
};
