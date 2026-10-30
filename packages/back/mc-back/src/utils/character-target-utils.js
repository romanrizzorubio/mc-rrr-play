import {checkCondition} from '../engine/utils.js';

export function resolveCharacterTarget(character, condition, matchActiveNameOnly) {
    if (Array.isArray(condition)) {
        return condition.map(alternative =>
            resolveCharacterTarget(character, alternative, matchActiveNameOnly))
            .find(Boolean);
    }

    const {name, ...otherConditions} = condition;
    if ((name !== undefined &&
            character.name !== name &&
            (matchActiveNameOnly || character.mainName !== name)) ||
        !checkCondition(character, otherConditions)) {
        return undefined;
    }

    if (name !== undefined && character.sides?.length) {
        return matchActiveNameOnly ?
            character.currentSide ?? character :
            character.sides.find(side => side.name === name) || character;
    }

    return character;
}

export function filterCharacterTargets(characters, condition, matchActiveNameOnly) {
    return condition ?
        characters.flatMap(character => {
            const target = resolveCharacterTarget(
                character, condition, matchActiveNameOnly);
            return target ? [target] : [];
        }) :
        characters;
}
