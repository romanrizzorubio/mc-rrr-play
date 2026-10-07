import {
    CHARACTER_ALL_ENGAGED_MINIONS,
    CHARACTER_ALL_HEROES,
    CHARACTER_ALLY,
    CHARACTER_ALTEREGO,
    CHARACTER_ENEMY,
    CHARACTER_ENGAGED,
    CHARACTER_HERO,
    CHARACTER_IDENTITY,
    CHARACTER_MINION,
    CHARACTER_VILLAIN,
} from './characters.js';
import {
    PLACE_ENCOUNTER_DECK,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    PLACE_OUTSIDE_NEMESIS,
} from './places.js';

export const TARGET_ACTIVATION = 'activation';
export const TARGET_ALL_CARDS = 'all-cards';
export const TARGET_ALL_CHARACTERS = 'all-characters';
export const TARGET_ALL_CHARACTERS_YOU_CONTROL = 'all-characters-you-control';
export const TARGET_ALL_ENEMIES = 'all-enemies';
export const TARGET_ALL_FRIENDLY_CHARACTERS = 'all-friendly-characters';
export const TARGET_ALL_ENGAGED_MINIONS = CHARACTER_ALL_ENGAGED_MINIONS;
export const TARGET_ALL_HEROES = CHARACTER_ALL_HEROES;
export const TARGET_ALL_HEROES_ALLIES = 'all-heroes-allies';
export const TARGET_ALL_PLAYERS = 'all-players';
export const TARGET_ALL_SCHEMES = 'all-schemes';
export const TARGET_ALL_SIDE_SCHEMES = 'all-side-schemes';
export const TARGET_ALL_ALLIES = 'all-allies';
export const TARGET_ALL_ALLIES_YOU_CONTROL = 'all-allies-you-control';
export const TARGET_ALLY = CHARACTER_ALLY;
export const TARGET_ALTEREGO = CHARACTER_ALTEREGO;
export const TARGET_ALTEREGO_SIDE = `${TARGET_ALTEREGO}-side`;
export const TARGET_ANY = 'any';
export const TARGET_ANY_PLAYER = 'any-player';
export const TARGET_ATTACHED = 'attached';
export const TARGET_ATTACK_UNDEFENDED = 'attack-undefended';
export const TARGET_ATTACKED = 'attacked';
export const TARGET_BY_TITLE = 'target-by-title';
export const TARGET_CARD = 'card';
export const TARGET_CHARACTER = 'character';
export const TARGET_CONDITION_CARD = 'condition-card';
export const TARGET_EFFECT = 'effect';
export const TARGET_EFFECT_PLAY_CARD = 'effect-play-card';
export const TARGET_ENCOUNTER_DECK = PLACE_ENCOUNTER_DECK;
export const TARGET_ENCOUNTER_DECK_CARDS = PLACE_ENCOUNTER_DECK_CARDS;
export const TARGET_ENCOUNTER_DISCARD = PLACE_ENCOUNTER_DISCARD;
export const TARGET_ENEMY = CHARACTER_ENEMY;
export const TARGET_ENGAGED = CHARACTER_ENGAGED;
export const TARGET_ENGAGED_HERO = 'engaged-hero';
export const TARGET_FRIENDLY_CHARACTER = 'friendly-character';
export const TARGET_HAND_RANDOM = 'hand-random';
export const TARGET_HERO = CHARACTER_HERO;
export const TARGET_HERO_SIDE = `${TARGET_HERO}-side`;
export const TARGET_IDENTITY = CHARACTER_IDENTITY;
export const TARGET_INITIAL_PLAYER = 'initial-player';
export const TARGET_MAIN_SCHEME = 'main-scheme';
export const TARGET_MINION = CHARACTER_MINION;
export const TARGET_MINION_HIGHEST_HP = 'minion-highest-hp';
export const TARGET_MINION_HIGHEST_PRINTED_HP = 'minion-highest-printed-hp';
export const TARGET_OUTSIDE_NEMESIS = PLACE_OUTSIDE_NEMESIS;
export const TARGET_OWNER = 'owner';
export const TARGET_PLAYER = 'player';
export const TARGET_PLAYER_DISCARD = 'player-discard';
export const TARGET_RANDOM = 'random';
export const TARGET_ROUND = 'round';
export const TARGET_SCENARIO = 'scenario';
export const TARGET_SCHEME = 'scheme';
export const TARGET_SELECTED_PLAYER_CHARACTERS = 'selected-player-characters';
export const TARGET_SIDE = 'side';
export const TARGET_SOURCE = 'source';
export const TARGET_SUPPORT_YOU_CONTROL = 'support-you-control';
export const TARGET_THIS = 'this';
export const TARGET_TOP_CARD = 'top-card';
export const TARGET_TREACHERY = 'treachery';
export const TARGET_TRIGGERED_CARD = 'triggered-card';
export const TARGET_UPGRADE_YOU_CONTROL = 'upgrade-you-control';
export const TARGET_VILLAIN = CHARACTER_VILLAIN;
export const TARGET_YOU = 'you';
export const TARGET_YOUR_HERO = 'your-hero';
export const TARGET_YOUR_SUPERHERO = 'your-superhero';
