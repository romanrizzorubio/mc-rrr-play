import {
    CARD_TYPE_ALLY,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_ENVIRONMENT,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_SUPERHERO,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CARD_TYPE_VILLAIN,
} from 'mc-shared';

import {CharacterGameCard} from './character-game-card.js';
import {GameCard} from './game-card.js';
import {SchemeGameCard} from './scheme-game-card.js';
import {Superhero} from '../match/superhero.js';

const ORIGINAL_GAME_CARD_TYPES = {
    [CARD_TYPE_ALLY]: CharacterGameCard,
    [CARD_TYPE_ALTEREGO]: CharacterGameCard,
    [CARD_TYPE_ATTACHMENT]: GameCard,
    [CARD_TYPE_ENVIRONMENT]: GameCard,
    [CARD_TYPE_EVENT]: GameCard,
    [CARD_TYPE_HERO]: CharacterGameCard,
    [CARD_TYPE_MAIN_SCHEME_A_CARD]: SchemeGameCard,
    [CARD_TYPE_MAIN_SCHEME_B_CARD]: SchemeGameCard,
    [CARD_TYPE_MINION]: CharacterGameCard,
    [CARD_TYPE_OBLIGATION]: GameCard,
    [CARD_TYPE_RESOURCE]: GameCard,
    [CARD_TYPE_SIDE_SCHEME_SCENARIO]: SchemeGameCard,
    [CARD_TYPE_SUPERHERO]: Superhero,
    [CARD_TYPE_SUPPORT]: GameCard,
    [CARD_TYPE_TREACHERY]: GameCard,
    [CARD_TYPE_UPGRADE]: GameCard,
    [CARD_TYPE_VILLAIN]: CharacterGameCard,
};

const CHARACTER_STATE_FIELDS = [
    '_damage',
    '_stunned',
    '_confused',
    '_tough',
    'modifyHitPoints',
    'modifyAttack',
    'modifyThwart',
    'extraTraits',
    'engaged',
    'isFacedownCard',
];

export class FacedownCharacterGameCard extends CharacterGameCard {
    static convert(gameCard, printedCard, id) {
        if (!(gameCard instanceof GameCard)) {
            throw new TypeError('Only a game card can be converted while facedown.');
        }
        if (!printedCard.isCharacter) {
            throw new TypeError('A facedown card can only be converted into a character.');
        }

        if (!Object.hasOwn(ORIGINAL_GAME_CARD_TYPES, gameCard.card.type)) {
            throw new TypeError(`Unsupported original card type: ${gameCard.card.type}`);
        }

        const originalState = CHARACTER_STATE_FIELDS.reduce((state, field) => ({
            ...state,
            [field]: {
                hasValue: Object.hasOwn(gameCard, field),
                value: gameCard[field],
            },
        }), {});

        gameCard.endTriggers(true);
        gameCard.facedownConversion = {
            abilities: gameCard.abilities,
            boostAbility: gameCard.boostAbility,
            card: gameCard.card,
            id: gameCard.id,
            selectedSide: gameCard.selectedSide,
            sides: gameCard.sides,
            state: originalState,
        };

        Object.setPrototypeOf(gameCard, FacedownCharacterGameCard.prototype);
        gameCard.card = printedCard;
        gameCard.abilities = [];
        gameCard.boostAbility = undefined;
        gameCard.id = id;
        gameCard.sides = [];
        delete gameCard.selectedSide;
        gameCard.faceDown = [];
        gameCard.attached = [];
        gameCard.isPlaying = false;
        gameCard._damage = 0;
        gameCard._stunned = 0;
        gameCard._confused = 0;
        gameCard._tough = 0;
        gameCard.modifyHitPoints = 0;
        gameCard.modifyAttack = 0;
        gameCard.modifyThwart = 0;
        gameCard.extraTraits = [];
        gameCard.engaged = null;
        gameCard.isFacedownCard = true;

        return gameCard;
    }
    async discard() {
        const {gameZone, owner, facedownConversion} = this;

        if (!facedownConversion) {
            throw new Error('A facedown character is missing its original card state.');
        }

        gameZone?.discard(this);
        await this.init();
        const originalCardType = facedownConversion.card.type;
        const GameCardType = ORIGINAL_GAME_CARD_TYPES[originalCardType];

        if (!GameCardType) {
            throw new Error(`Unknown original card type: ${originalCardType}`);
        }

        Object.setPrototypeOf(this, GameCardType.prototype);
        this.card = facedownConversion.card;
        this.abilities = facedownConversion.abilities;
        this.boostAbility = facedownConversion.boostAbility;
        this.id = facedownConversion.id;
        this.sides = facedownConversion.sides;
        if (facedownConversion.selectedSide === undefined) {
            delete this.selectedSide;
        } else {
            this.selectedSide = facedownConversion.selectedSide;
        }

        for (const [field, {hasValue, value}] of Object.entries(facedownConversion.state)) {
            if (hasValue) {
                this[field] = value;
            } else {
                delete this[field];
            }
        }

        delete this.facedownConversion;
        this.initAbilities();
        owner.deck.discardPile.push(this);
        await owner.deck.refresh();
    }
    toObj() {
        return {
            ...super.toObj(arguments[0]),
            faceDown: [],
            isFacedownCard: true,
        };
    }
}
