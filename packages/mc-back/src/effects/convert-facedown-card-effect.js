import {CARD_MAP} from '../factory/cards/cards-map.js';
import {FacedownCharacterGameCard} from '../model/cards/facedown-character-game-card.js';
import {Effect} from './effect.js';

export class ConvertFacedownCardEffect extends Effect {
    constructor({
        card,
        cardParams,
        cardType,
    }) {
        super(arguments[0]);

        if (!cardType || !Object.hasOwn(CARD_MAP, cardType)) {
            throw new TypeError(`Unsupported converted card type: ${cardType}`);
        }
        if (!cardParams || typeof cardParams !== 'object') {
            throw new TypeError('ConvertFacedownCardEffect requires card parameters.');
        }

        this.card = card;
        this.cardType = cardType;
        this.cardParams = cardParams;
    }
    async execute(params) {
        const originalCard = this.card ?? params.triggeredCard ?? params.card;
        if (!originalCard) {
            throw new TypeError('ConvertFacedownCardEffect requires a card parameter.');
        }

        const {cardParams, cardType} = this;
        const sequence = (this.match.facedownMinionSequence || 0) + 1;
        const id = `facedown-minion-${sequence}`;
        const PrintedCard = CARD_MAP[cardType];
        const printedCard = new PrintedCard({
            name: '',
            set: '',
            image: '',
            ...cardParams,
            id,
            match: this.match,
            type: cardType,
        });

        if (!printedCard.isCharacter) {
            throw new TypeError(`Converted card type "${cardType}" must be a character.`);
        }

        printedCard.boost = undefined;
        printedCard.boostAbility = undefined;
        this.match.facedownMinionSequence = sequence;

        FacedownCharacterGameCard.convert(originalCard, printedCard, id);
    }
}
