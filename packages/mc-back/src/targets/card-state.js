import {
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_ATTACHED,
    TARGET_ENGAGED,
    TARGET_HERO_SIDE,
    TARGET_OUTSIDE_NEMESIS,
    TARGET_SIDE,
    TARGET_YOUR_SUPERHERO,
} from 'mc-shared';

export const cardStateTargets = {
    [TARGET_ALTEREGO]: ({player}) => player.isAlterEgo ? [player] : [],
    [TARGET_ALTEREGO_SIDE]: ({card}) => card.sides.filter(side => side.isAlterEgo),
    [TARGET_ATTACHED]: ({ability}) => ability.card.attachedTo ? [ability.card.attachedTo] : [],
    [TARGET_ENGAGED]: ({card}) => [card.engaged],
    [TARGET_HERO_SIDE]: ({card}) => card.sides.filter(side => side.isHero),
    [TARGET_OUTSIDE_NEMESIS]: ({player}) => player.superhero.nemesis,
    [TARGET_SIDE]: ({card}) => card.sides.filter(side => side !== card.currentSide),
    [TARGET_YOUR_SUPERHERO]: ({player}) => [player.superhero],
};
