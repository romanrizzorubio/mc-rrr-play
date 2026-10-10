import {basicTargets} from './basic.js';
import {groupTargets} from './groups.js';
import {playerControlledTargets} from './player-controlled.js';
import {cardStateTargets} from './card-state.js';
import {encounterTargets} from './encounter.js';
import {specialTargets} from './special.js';
import {deckAndDeckTargets} from './deck.js';

export const targetMap = {
    ...basicTargets,
    ...groupTargets,
    ...playerControlledTargets,
    ...cardStateTargets,
    ...encounterTargets,
    ...specialTargets,
    ...deckAndDeckTargets,
};

export {basicTargets} from './basic.js';
export {groupTargets} from './groups.js';
export {playerControlledTargets} from './player-controlled.js';
export {cardStateTargets} from './card-state.js';
export {encounterTargets} from './encounter.js';
export {specialTargets} from './special.js';
export {deckAndDeckTargets} from './deck.js';
