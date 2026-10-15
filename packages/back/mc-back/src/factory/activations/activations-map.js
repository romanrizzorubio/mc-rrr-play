import {
    ACTIVATION_ATTACK,
    ACTIVATION_DEFENSE,
    ACTIVATION_RECOVERY,
    ACTIVATION_SCHEME,
    ACTIVATION_THWART,
} from 'mc-shared';
import {Attack} from '../../activations/attack.js';
import {Defense} from '../../activations/defense.js';
import {Recovery} from '../../activations/recovery.js';
import {Scheme} from '../../activations/scheme.js';
import {Thwart} from '../../activations/thwart.js';

export const ACTIVATION_MAP = {
    [ACTIVATION_ATTACK]: Attack,
    [ACTIVATION_DEFENSE]: Defense,
    [ACTIVATION_RECOVERY]: Recovery,
    [ACTIVATION_SCHEME]: Scheme,
    [ACTIVATION_THWART]: Thwart,
};
