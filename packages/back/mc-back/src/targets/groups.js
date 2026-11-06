import {
    TARGET_ALL_CARDS,
    TARGET_ALL_CHARACTERS,
    TARGET_ALL_ENEMIES,
    TARGET_ALL_ALLIES,
    TARGET_ALL_FRIENDLY_CHARACTERS,
    TARGET_ALL_HEROES,
    TARGET_ALL_HEROES_ALLIES,
    TARGET_ALL_MINIONS,
    TARGET_SELECTED_PLAYER_CHARACTERS,
    TARGET_ALL_PLAYERS,
    TARGET_ALL_SUPPORTS,
    TARGET_ALL_SIDE_SCHEMES,
    TARGET_ENVIRONMENT,
    TARGET_CHARACTER,
    TARGET_ENEMY,
    TARGET_FRIENDLY_CHARACTER,
    TARGET_HERO,
    TARGET_MINION,
    TARGET_PLAYER_LOWEST_HERO_LIFE,
    TARGET_VILLAIN,
    TARGET_YOUR_HERO,
} from 'mc-shared';
import {checkCondition} from '../engine/utils.js';
import {filterTargetsByCondition} from '../utils/target-condition-utils.js';
import {filterCharacterTargets} from '../utils/character-target-utils.js';
import {
    getCharactersFor,
    getEnemiesFor,
    getFriendsFor,
    getHeroesFor,
    getMinionsFor,
    getPlayersFor,
    getScenarioZone,
    getSideSchemesFor,
    getVillainFor,
} from '../utils/match-zone-utils.js';

export const groupTargets = {
    [TARGET_ALL_SUPPORTS]: ({match, player, condition}) =>
        filterTargetsByCondition(
            match.searchCards({isSupport: true}, player), condition),
    [TARGET_ALL_CARDS]: ({cards, condition}) =>
        filterTargetsByCondition(cards, condition),
    [TARGET_ALL_ALLIES]: ({match, player, condition}) =>
        filterTargetsByCondition(
            getPlayersFor(match, player).flatMap(zonePlayer => zonePlayer.allies),
            condition),
    [TARGET_ALL_CHARACTERS]: ({match, condition, playCardEffect, player}) => {
        const characters = getCharactersFor(match, player);

        return condition ?
            filterCharacterTargets(
                characters,
                condition,
                Boolean(playCardEffect)
            ) :
            characters;
    },
    [TARGET_ALL_ENEMIES]: ({match, player, condition}) =>
        filterTargetsByCondition(getEnemiesFor(match, player), condition),
    [TARGET_ALL_FRIENDLY_CHARACTERS]: ({
        match,
        condition,
        playCardEffect,
        player,
    }) => {
        const characters = getFriendsFor(match, player);

        return condition ?
            filterCharacterTargets(
                characters,
                condition,
                Boolean(playCardEffect)
            ) :
            characters;
    },
    [TARGET_FRIENDLY_CHARACTER]: ({
        match,
        condition,
        playCardEffect,
        player,
    }) => {
        const characters = getFriendsFor(match, player);

        return condition ?
            filterCharacterTargets(
                characters,
                condition,
                Boolean(playCardEffect)
            ) :
            characters;
    },
    [TARGET_ALL_HEROES]: ({match, player, condition}) =>
        filterTargetsByCondition(getHeroesFor(match, player), condition),
    [TARGET_ALL_HEROES_ALLIES]: ({match, player, condition}) => {
        const heroes = new Set(getHeroesFor(match, player));
        const characters = getPlayersFor(match, player).reduce((characters, zonePlayer) => {
            if (heroes.has(zonePlayer)) {
                characters.push(zonePlayer.superhero?.currentSide ??
                    zonePlayer.superhero);
            }
            return characters.concat(zonePlayer.allies);
        }, []);
        return filterTargetsByCondition(characters, condition);
    },
    [TARGET_ALL_MINIONS]: ({match, player, condition}) =>
        filterTargetsByCondition(getMinionsFor(match, player), condition),
    [TARGET_SELECTED_PLAYER_CHARACTERS]: ({match, params, player}) => {
        const {targetPlayer} = params;

        if (!targetPlayer ||
            (player && !getPlayersFor(match, player).includes(targetPlayer))) {
            return [];
        }

        return targetPlayer.friends.map(character => character.currentSide);
    },
    [TARGET_ALL_PLAYERS]: ({match, player, condition}) =>
        filterTargetsByCondition(getPlayersFor(match, player), condition),
    [TARGET_PLAYER_LOWEST_HERO_LIFE]: ({match, player}) => {
        const heroes = getHeroesFor(match, player);
        if (!heroes.length) {
            return [];
        }

        const lowestLife = Math.min(...heroes.map(zonePlayer =>
            zonePlayer.superhero.life));

        return heroes.filter(zonePlayer =>
            zonePlayer.superhero.life === lowestLife);
    },
    [TARGET_ALL_SIDE_SCHEMES]: ({match, player, condition}) =>
        filterTargetsByCondition(getSideSchemesFor(match, player), condition),
    [TARGET_ENVIRONMENT]: ({condition, match, player}) =>
        (getScenarioZone(match, player)?.cards ?? []).filter(card =>
            card.isEnvironment && (!condition || checkCondition(card, condition))),
    [TARGET_CHARACTER]: ({match, player, condition, playCardEffect}) =>
        filterCharacterTargets(
            getCharactersFor(match, player), condition, Boolean(playCardEffect)),
    [TARGET_ENEMY]: ({match, player, condition}) =>
        filterTargetsByCondition(getEnemiesFor(match, player), condition),
    [TARGET_HERO]: ({condition, match, playCardEffect, player}) => {
        const heroes = getHeroesFor(match, player)
            .map(zonePlayer => zonePlayer.superhero.currentSide);

        return condition ?
            filterCharacterTargets(
                heroes,
                condition,
                Boolean(playCardEffect)
            ) :
            heroes;
    },
    [TARGET_MINION]: ({match, player, condition}) =>
        filterTargetsByCondition(getMinionsFor(match, player), condition),
    [TARGET_VILLAIN]: ({match, player}) => {
        const villain = getVillainFor(match, player);
        return villain ? [villain] : [];
    },
    [TARGET_YOUR_HERO]: ({player}) =>
        player.isHero ? [player.superhero.currentSide] : [],
};
