import {checkCondition, path} from '../engine/utils.js';
import {
    TARGET_ACTIVATION,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_EFFECT_PLAY_CARD,
    TARGET_INITIAL_PLAYER,
    TARGET_PLAYER,
    TARGET_REVEALED_ABILITY,
    TARGET_ROUND,
    TARGET_SCENARIO,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_TRIGGERED_CARD,
    TARGET_YOU,
} from 'mc-shared';

export const basicTargets = {
    [TARGET_ACTIVATION]: ({activation}) => [activation],
    [TARGET_CARD]: ({card}) => [card],
    [TARGET_EFFECT]: ({effect}) => [effect],
    [TARGET_EFFECT_PLAY_CARD]: ({playCardEffect}) => [playCardEffect],
    [TARGET_INITIAL_PLAYER]: ({match}) => match.initialPlayer ? [match.initialPlayer] : [],
    [TARGET_PLAYER]: ({player}) => [player],
    [TARGET_REVEALED_ABILITY]: ({params}) => {
        const ability = path(params, TARGET_REVEALED_ABILITY);

        return ability ? [ability] : [];
    },
    [TARGET_ROUND]: ({currentRound}) => [currentRound],
    [TARGET_SCENARIO]: ({match}) => [match.scenario],
    [TARGET_SOURCE]: ({condition, params, source}) => {
        const targets = path(params, source);

        if (!Array.isArray(targets)) {
            return [];
        }

        return condition ?
            targets.filter(target => checkCondition(target, condition)) :
            targets;
    },
    [TARGET_THIS]: ({ability}) => [path(ability, 'card')],
    [TARGET_TRIGGERED_CARD]: ({triggeredCard}) => [triggeredCard],
    [TARGET_YOU]: ({player}) => [player],
};
