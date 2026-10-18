import {
    ABILITY_ACTION,
    DIALOG_DISCARD_RANDOM_HAND,
    RESOURCE_ANY,
    RESOURCE_WILD,
    TARGET_YOU,
} from 'mc-shared';
import {REFRESH_EVENTS} from 'mc-endpoints';
import {Engine} from '../../engine/engine.js';
import {checkCondition, random} from '../../engine/utils.js';
import {PlayCardEffect} from '../../effects/play-card-effect.js';
import {getEffectTargetEntries} from '../../utils/effect-targets.js';
import {getResourceIcons} from '../../utils/resource-requirements.js';
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
        } else if (card.abilities?.some(ability => ability.workInHand)) {
            card.initTriggers(undefined, {workInHandOnly: true});
        }

        this.cards.push(card);
    }
    addCards(cards) {
        cards.forEach(this.addCard.bind(this));
    }
    discardHand(card) {
        if (card.isEvent ||
            (card.abilities?.some(ability => ability.workInHand) &&
                !card.isPlaying &&
                !card.isInPlay)) {
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
    getCardsToPay(
        cardToPlay,
        resourceType,
        excludedCardIds = new Set(),
        resourceUsage,
        {printedResources = false} = {}
    ) {
        const resourceTypes = normalizeResourceTypes(resourceType);
        const unrestricted = !resourceTypes.length ||
            resourceTypes.includes(RESOURCE_ANY);

        return this.cards.filter(card => {
            const availableResources = resourceUsage?.get(card.id) ??
                getResourceIcons(card, {
                    printed: printedResources,
                    cardToPay: cardToPlay,
                });

            return !excludedCardIds.has(card.id) &&
                !card.isPlaying &&
                (!cardToPlay || card !== cardToPlay) &&
                (unrestricted || availableResources.some(resource =>
                    resourceTypes.includes(resource) || resource === RESOURCE_WILD));
        }).map(card => {
            if (!resourceUsage?.has(card.id)) {
                return card;
            }

            const payableCard = Object.create(card);
            const resources = resourceUsage.get(card.id).slice();
            Object.defineProperties(payableCard, {
                resources: {
                    value: resources,
                    enumerable: true,
                },
                toObj: {
                    value: (...args) => ({
                        ...card.toObj(...args),
                        resources,
                    }),
                },
            });

            return payableCard;
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

        return Promise.all(cards.map(async card => {
            const playable = !card.card.isResource && await card.canPlay({
                player: owner,
                abilityType: ABILITY_ACTION,
                checkOnly: true,
            });
            const playTargets = playable ?
                await this.getPlayTargets(card) :
                {
                    playableTargetIds: [],
                    playableInGameZone: false,
                };

            return {
                ...card.toObj(),
                playable,
                ...playTargets,
            };
        }));
    }
    getTargetIds(targets) {
        return [...new Set(targets.flat(Infinity)
            .flatMap(target => [target?.id, target?.parentId])
            .filter(id => id !== undefined && id !== null))];
    }
    async getEffectTargets(effect, params, visited = new Set()) {
        const entries = await getEffectTargetEntries(effect, params, visited);

        return entries.flatMap(({targets}) => targets);
    }
    async getPlayTargets(card) {
        const {owner: player} = this;
        const match = this.match;
        const targetInfo = (targets, playableInGameZone) => ({
            playableTargetIds: this.getTargetIds(targets),
            playableInGameZone,
        });

        if (card.isEvent) {
            const ability = card.abilities?.[0];
            if (!ability?.effect) {
                return targetInfo([], true);
            }

            ability.prepareEffect();
            const playCardEffect = new PlayCardEffect({
                ability,
                card,
                match,
            });
            const params = {
                ability,
                card,
                match,
                player,
                playCardEffect,
            };
            const targets = await this.getEffectTargets(
                ability.effect,
                params
            );

            const playableTargetIds = this.getTargetIds(targets);
            return {
                playableTargetIds,
                playableInGameZone: playableTargetIds.length === 0,
            };
        }

        if (card.isUpgrade) {
            const printedCard = card.card;
            if (printedCard.controllerTarget) {
                const playCardEffect = new PlayCardEffect({card, match});
                const targets = await playCardEffect.getValidTarget({
                    card,
                    match,
                    player,
                    playCardEffect,
                });

                return targetInfo(targets, true);
            }

            const attachTarget = printedCard.getAttachConfig?.().target ??
                printedCard.attach ??
                TARGET_YOU;
            if (attachTarget === TARGET_YOU) {
                return targetInfo([], true);
            }

            const attachEffect = printedCard.createAttachEffect(card);
            const targets = await attachEffect.getValidTarget({
                card,
                match,
                player,
            });

            return targetInfo(targets, false);
        }

        return targetInfo([], true);
    }
}