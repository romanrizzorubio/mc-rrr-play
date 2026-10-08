import {
    TARGET_ALL_CARDS,
    TARGET_ALL_CHARACTERS,
    TARGET_ALL_ENEMIES,
    TARGET_ALL_ALLIES,
    TARGET_ALL_FRIENDLY_CHARACTERS,
    TARGET_ALL_HEROES,
    TARGET_ALL_HEROES_ALLIES,
    TARGET_SELECTED_PLAYER_CHARACTERS,
    TARGET_ALL_PLAYERS,
    TARGET_ALL_SIDE_SCHEMES,
    TARGET_ENVIRONMENT,
    TARGET_CHARACTER,
    TARGET_ENEMY,
    TARGET_HERO,
    TARGET_MINION,
    TARGET_VILLAIN,
    TARGET_YOUR_HERO,
} from 'mc-shared';
import {checkCondition} from '../engine/utils.js';

const resolveCharacterCondition = (character, condition) => {
    const {name, ...otherConditions} = condition;

    if ((name !== undefined &&
            character.name !== name &&
            character.mainName !== name) ||
        !checkCondition(character, otherConditions)) {
        return undefined;
    }

    if (name !== undefined && character.sides?.length) {
        return character.sides.find(side => side.name === name) || character;
    }

    return character;
};
const filterCharactersByCondition = (characters, condition) =>
    characters.flatMap(character => {
        const target = resolveCharacterCondition(character, condition);

        return target ? [target] : [];
    });

export const groupTargets = {
    [TARGET_ALL_CARDS]: ({cards}) => cards,
    [TARGET_ALL_ALLIES]: ({match}) =>
        match.players.flatMap(player => player.allies),
    [TARGET_ALL_CHARACTERS]: ({match, condition}) => {
        const characters = match.enemies.concat(match.friends);

        return condition ?
            filterCharactersByCondition(characters, condition) :
            characters;
    },
    [TARGET_ALL_ENEMIES]: ({match}) => match.enemies,
    [TARGET_ALL_FRIENDLY_CHARACTERS]: ({match, condition}) => {
        const characters = match.friends;

        return condition ?
            filterCharactersByCondition(characters, condition) :
            characters;
    },
    [TARGET_ALL_HEROES]: ({match}) => match.heroes,
    [TARGET_ALL_HEROES_ALLIES]: ({match}) => match.heroesAndAllies,
    [TARGET_SELECTED_PLAYER_CHARACTERS]: ({params}) => {
        const {targetPlayer} = params;

        if (!targetPlayer) {
            return [];
        }

        return targetPlayer.friends.map(character => character.currentSide);
    },
    [TARGET_ALL_PLAYERS]: ({match}) => match.players,
    [TARGET_ALL_SIDE_SCHEMES]: ({match}) => match.sideSchemes,
    [TARGET_ENVIRONMENT]: ({match}) =>
        match.scenario.gameZone.cards.filter(card => card.isEnvironment),
    [TARGET_CHARACTER]: ({match}) => match.characters,
    [TARGET_ENEMY]: ({match}) => match.enemies,
    [TARGET_HERO]: ({match}) =>
        match.heroes.map(player => player.superhero.currentSide),
    [TARGET_MINION]: ({match}) => match.minions,
    [TARGET_VILLAIN]: ({match}) => [match.villain],
    [TARGET_YOUR_HERO]: ({player}) =>
        player.isHero ? [player.superhero.currentSide] : [],
};
