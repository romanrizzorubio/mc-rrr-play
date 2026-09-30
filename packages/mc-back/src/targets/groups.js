import {
    TARGET_ALL_CARDS,
    TARGET_ALL_CHARACTERS,
    TARGET_ALL_ENEMIES,
    TARGET_ALL_HEROES,
    TARGET_ALL_HEROES_ALLIES,
    TARGET_ALL_PLAYERS,
    TARGET_ALL_SIDE_SCHEMES,
    TARGET_CHARACTER,
    TARGET_ENEMY,
    TARGET_HERO,
    TARGET_MINION,
    TARGET_VILLAIN,
} from '../constants/targets.js';

export const groupTargets = {
    [TARGET_ALL_CARDS]: ({cards}) => cards,
    [TARGET_ALL_CHARACTERS]: ({match}) => match.enemies.concat(match.friends),
    [TARGET_ALL_ENEMIES]: ({match}) => match.enemies,
    [TARGET_ALL_HEROES]: ({match}) => match.heroes,
    [TARGET_ALL_HEROES_ALLIES]: ({match}) => match.heroesAndAllies,
    [TARGET_ALL_PLAYERS]: ({match}) => match.players,
    [TARGET_ALL_SIDE_SCHEMES]: ({match}) => match.sideSchemes,
    [TARGET_CHARACTER]: ({match}) => match.characters,
    [TARGET_ENEMY]: ({match}) => match.enemies,
    [TARGET_HERO]: ({player}) => player.isHero ? [player.superhero.currentSide] : [],
    [TARGET_MINION]: ({match}) => match.minions,
    [TARGET_VILLAIN]: ({match}) => [match.villain],
};
