import {readdir} from 'node:fs/promises';

import {Ability} from '../abilities/core/ability.js';
import {Arrow} from '../abilities/core/arrow.js';
import {AttackBasicAbility} from '../abilities/basic/attack-basic-ability.js';
import {RecoveryBasicAbility} from '../abilities/basic/recovery-basic-ability.js';
import {ThwartBasicAbility} from '../abilities/basic/thwart-basic-ability.js';
import {QuickstrikeAbility} from '../abilities/misc/quickstrike-ability.js';
import {EndLastingAbility} from '../abilities/misc/end-lasting-ability.js';
import {LastingAbility} from '../abilities/misc/lasting-ability.js';
import {Activation} from '../activations/activation.js';
import {Effect} from '../effects/effect.js';
import {Calc} from '../engine/calc.js';
import {Engine} from '../engine/engine.js';
import {Lasting} from '../engine/lasting.js';
import {ACTIVATION_MAP} from '../factory/activations/activations-map.js';
import {ABILITY_MAP} from '../factory/abilities/abilities-map.js';
import {CARD_MAP} from '../factory/cards/cards-map.js';
import {EFFECT_MAP} from '../factory/effects/effects-map.js';
import {TRIGGER_MAP} from '../factory/triggers/triggers-map.js';
import {CharacterGameCard} from '../model/cards/character-game-card.js';
import {FacedownCharacterGameCard} from '../model/cards/facedown-character-game-card.js';
import {GameCard} from '../model/cards/game-card.js';
import {SchemeGameCard} from '../model/cards/scheme-game-card.js';
import {Icons} from '../model/commons/icons.js';
import {Keywords} from '../model/commons/keywords.js';
import {Limit} from '../model/commons/limit.js';
import {Maximum} from '../model/commons/maximum.js';
import {Deck} from '../model/match/deck.js';
import {FaceDown} from '../model/match/facedown.js';
import {GameZone} from '../model/match/game-zone.js';
import {Hand} from '../model/match/hand.js';
import {Match} from '../model/match/match.js';
import {Player} from '../model/match/player.js';
import {PlayerDeck} from '../model/match/player-deck.js';
import {PlayerZone} from '../model/match/player-zone.js';
import {Scenario} from '../model/match/scenario.js';
import {ScenarioZone} from '../model/match/scenario-zone.js';
import {Superhero} from '../model/match/superhero.js';
import {Card} from '../model/printed/card.js';
import {Trigger} from '../triggers/base/trigger.js';
import {ValidTarget} from '../targets/valid-target.js';
import {MatchFactory} from '../factory/match-factory.js';

export const VALID_TARGET_FILTER_MARKER = Symbol('valid-target-filter');

const typesByName = new Map();
const typesByConstructor = new Map();

function registerSnapshotType(ModelType, options = {}) {
    const existing = typesByName.get(ModelType.name);
    if (existing && existing.ModelType !== ModelType) {
        throw new Error(`Duplicate match snapshot type "${ModelType.name}"`);
    }

    const registration = existing || {
        ModelType,
        name: ModelType.name,
    };
    if (options.ignoredProperties) {
        registration.ignoredProperties = new Set(options.ignoredProperties);
    }
    if (options.encodeProperty) {
        registration.encodeProperty = options.encodeProperty;
    }
    if (options.restore) {
        registration.restore = options.restore;
    }

    typesByName.set(registration.name, registration);
    typesByConstructor.set(ModelType, registration);
}

const modelTypes = [
    Ability,
    Activation,
    Arrow,
    AttackBasicAbility,
    Calc,
    Card,
    CharacterGameCard,
    Deck,
    Effect,
    EndLastingAbility,
    Engine,
    FaceDown,
    FacedownCharacterGameCard,
    GameCard,
    GameZone,
    Hand,
    Icons,
    Keywords,
    Lasting,
    LastingAbility,
    Limit,
    Match,
    Maximum,
    Player,
    PlayerDeck,
    PlayerZone,
    QuickstrikeAbility,
    RecoveryBasicAbility,
    Scenario,
    ScenarioZone,
    SchemeGameCard,
    Superhero,
    ThwartBasicAbility,
    Trigger,
    ValidTarget,
    ...Object.values(ACTIVATION_MAP),
    ...Object.values(ABILITY_MAP),
    ...Object.values(CARD_MAP),
    ...Object.values(EFFECT_MAP),
    ...Object.values(TRIGGER_MAP),
];

modelTypes.forEach(ModelType => registerSnapshotType(ModelType));

registerSnapshotType(Match, {
    ignoredProperties: [
        'activationsFactory',
        'effectsFactory',
        'matchFactory',
        'mc',
    ],
    restore: (match, {mc}) => {
        match.mc = mc;
        match.initializing = false;
        new MatchFactory(match);
    },
});

registerSnapshotType(ValidTarget, {
    encodeProperty: (validTarget, propertyName, value, encodeValue) => {
        if (propertyName === '_filter' && typeof value === 'function') {
            if (!validTarget.effect || value.name !== 'bound filterTarget') {
                throw new Error(`Cannot persist ValidTarget filter "${value.name}"`);
            }
            return {kind: 'valid-target-filter'};
        }
        return encodeValue(value, validTarget, propertyName);
    },
    restore: validTarget => {
        if (validTarget._filter === VALID_TARGET_FILTER_MARKER) {
            if (!validTarget.effect || typeof validTarget.effect.filterTarget !== 'function') {
                throw new Error('Cannot restore the match target filter');
            }
            validTarget._filter = validTarget.effect.filterTarget.bind(validTarget.effect);
        }
    },
});

async function registerSubclassesFromDirectory(directory, BaseType) {
    const entries = await readdir(directory, {withFileTypes: true});
    const modules = await Promise.all(entries
        .filter(entry => entry.isFile() && entry.name.endsWith('.js'))
        .map(entry => import(new URL(entry.name, directory).href)));

    modules
        .flatMap(module => Object.values(module))
        .filter(ModelType => typeof ModelType === 'function' &&
            ModelType.prototype &&
            BaseType.prototype.isPrototypeOf(ModelType.prototype))
        .forEach(ModelType => registerSnapshotType(ModelType));
}

await registerSubclassesFromDirectory(new URL('../effects/', import.meta.url), Effect);
await registerSubclassesFromDirectory(new URL('../engine/', import.meta.url), Engine);

export const getSnapshotType = value => {
    const constructor = Object.getPrototypeOf(value)?.constructor;

    return typesByConstructor.get(constructor);
};

export const getSnapshotTypeByName = name => typesByName.get(name);

export const isMatchSnapshot = value => value instanceof Match;

export const shouldIgnoreSnapshotProperty = (value, propertyName) =>
    getSnapshotType(value)?.ignoredProperties?.has(propertyName) || false;

export const encodeSnapshotProperty = (value, propertyName, propertyValue, encodeValue) => {
    const registration = getSnapshotType(value);

    return registration?.encodeProperty ?
        registration.encodeProperty(value, propertyName, propertyValue, encodeValue) :
        encodeValue(propertyValue, value, propertyName);
};

export function restoreSnapshotTypes(objects, context) {
    objects.forEach(object => {
        getSnapshotType(object)?.restore?.(object, context);
    });
}
