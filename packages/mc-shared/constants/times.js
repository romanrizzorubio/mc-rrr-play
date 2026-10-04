import {TRIGGER_PHASE_ENDS, TRIGGER_ROUND_ENDS} from './triggers.js';

export const TIME_PHASE = 'phase';
export const TIME_ROUND = 'round';
export const TIME_TRIGGER_MAP = {
    [TIME_PHASE]: TRIGGER_PHASE_ENDS,
    [TIME_ROUND]: TRIGGER_ROUND_ENDS,
};
