import {bombScare, explosion, falseAlarm, hydraBomber} from './cards.js';

export const MOD_BOMB_SCARE = 'bomb-scare';

export const config = {
    name: MOD_BOMB_SCARE,
    standard: true,
    cards: [
        {count: 1, card: bombScare},
        {count: 2, card: hydraBomber},
        {count: 1, card: explosion},
        {count: 2, card: falseAlarm},
    ],
};
