import {
    ABILITY_ACTION,
    DIALOG_DISCARD_RANDOM_HAND,
    RESOURCE_ANY,
    RESOURCE_WILD,
} from 'mc-shared';
import {REFRESH_EVENTS} from 'mc-endpoints';
import {Engine} from '../../engine/engine.js';
import {checkCondition, random} from '../../engine/utils.js';
import {normalizeResourceTypes} from '../../utils/resource-types.js';

export class Hand extends Engine {
    constructor(owner) {
        super();

        this.owner = owner;

        this.cards = [];
    }
    get match() {
        return this.owner.match;
    }
    get objectToRefresh() {
        return 'hand';
    }
    addCard(card) {
        if (card.isEvent) {
            card.initTriggers();
        }

        this.cards.push(card);
    }
    addCards(cards) {
        cards.forEach(this.addCard.bind(this));
    }
    discardHand(card) {
        if (card.isEvent) {
            card.endTriggers();
        }
        const index = this.cards.indexOf(card);
        if (index > -1) {
            this.cards.splice(index, 1);
        }
    }
    async discardRandom(showDialog = false) {
        const {cards} = this;

        let card;

        if (showDialog) {
            const {selected} = await this.openDialog({
                dialogType: DIALOG_DISCARD_RANDOM_HAND,
                data: {
                    cards: cards.map(_card => _card.toObj(arguments[0])),
                }
            });

            if (selected) {
                card = cards.find(_card => _card.id === selected.id);
            }
        } else {
            const index = random(0, cards.length - 1);
            card = this.cards[index];
        }

        this.discardHand(card);

        return card;
    }
    getCard(cardId) {
        return this.cards.find(card => card.id === cardId);
    }
    getCardsToPay(cardToPlay, resourceType, excludedCardIds = new Set()) {
        const resourceTypes = normalizeResourceTypes(resourceType);
        const unrestricted = !resourceTypes.length ||
            resourceTypes.includes(RESOURCE_ANY);

        return this.cards.filter(card => {
            return !excludedCardIds.has(card.id) &&
                !card.isPlaying &&
                (!cardToPlay || card !== cardToPlay) &&
                (unrestricted || card.card.getResources(cardToPlay).some(resource =>
                    resourceTypes.includes(resource) || resource === RESOURCE_WILD));
        });
    }
    searchCards(condition) {
        return this.cards
            .filter(card =>
                checkCondition(card, condition));
    }
    async refresh() {
        const {match, objectToRefresh} = this;

        match.mc.mcSocket.send(
            match.name,
            REFRESH_EVENTS[objectToRefresh],
            await this.toObjWithPlayability()
        );
    }
    toObj() {
        const {cards} = this;

        return cards.map(card => card.toObj(arguments[0]));
    }
    async toObjWithPlayability() {
        const {cards, owner} = this;

        return Promise.all(cards.map(async card => ({
            ...card.toObj(),
            playable: !card.card.isResource && await card.canPlay({
                player: owner,
                abilityType: ABILITY_ACTION,
                checkOnly: true,
            }),
        })));
    }
}