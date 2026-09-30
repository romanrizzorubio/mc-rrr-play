import {allies} from './allies.js';
import {events} from './events.js';
import {resources} from './resources.js';
import {supports} from './supports.js';
import {upgrades} from './upgrades.js';

export const protection = [
    ...allies,
    ...events,
    ...supports,
    ...upgrades,
    ...resources,
];
