import {DIALOG_PAY_COST,TRIGGER_END_PLAY_CARD, TRIGGER_PLAY_CARD, TRIGGER_THIS_END_PLAY_CARD} from 'mc-shared';

import {Effect} from './effect.js';
import {GetCostEffect} from './get-cost-effect.js';
import {PayCostEffect} from './pay-cost-effect.js';
import {PutPlayEffect} from './put-play-effect.js';

export class PlayCardEffect extends Effect {
    constructor({
        card,
        ability,
        abilityType,
    }) {
        super(arguments[0]);

        this.card = card;
        this.ability = ability;
        this.abilityType = abilityType;

        this.resourcesPaid = [];
        this.canceled = false;
        this.modifyCost = 0;
        this.removedFromHand = false;
        this.played = false;

        if (card.isUpgrade) {
            this.target = card.card.attach;
        }
    }
    get isAttack() {
        return false;
    }
    canRun(params) {
        const {card, ability, abilityType} = this;
        const {player} = params;

        if (card.isPlayerCard && this.match.isUniqueCard(card)) {
            return false;
        }

        if (ability) {
            return true;
        }

        return card.canPlay({
            player,
            abilityType,
            card,
        });
    }
    filterTarget(target, {player}) {
        if (super.filterTarget.apply(this, arguments)) {
            const {card} = this;

            if (card.isUpgrade) {
                return card.canAttach(target, player);
            }

            return true;
        }

        return false;
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([
                TRIGGER_PLAY_CARD,
            ]);
    }
    getTriggersEnds() {
        return super.getTriggersEnds()
            .concat([
                TRIGGER_END_PLAY_CARD,
                TRIGGER_THIS_END_PLAY_CARD,
            ]);
    }
    async doPlay(params) {
        const {card, cardsPaid, ability, selectedTarget} = this;
        const {player} = params;

        this.played = true;

        if (cardsPaid) {
            const payCostEffect = new PayCostEffect({
                hand: cardsPaid.hand,
                generators: cardsPaid.generators,
                selectedTarget: card,
                match: this.match,
            });

            await payCostEffect.runEffect({player});
        }

        if (card.isEvent) {
            await ability.resolveAbility({
                ...params,
                playCardEffect: this,
            });

            await player.deck.discard(card);
        } else {
            const putPlayEffect = new PutPlayEffect({
                card,
                selectedTarget,
                controller: player,
                match: this.match,
            });

            await putPlayEffect.runEffect({
                ...params,
                effect: this,
                card,
            });
        }
        card.isPlaying = false;
        if (!this.removedFromHand || player.hand.cards.includes(card)) {
            player.hand.discardHand(card);
        }
        this.removedFromHand = false;
        await player.hand.refresh();
    }
    async getCost(params) {
        const {card} = params;

        const getCostEffect = new GetCostEffect({
            selectedTarget: card,
            match: this.match,
        });

        await getCostEffect.runEffect(params);

        return getCostEffect.cost;
    }
    isResolved() {
        return !this.canceled;
    }
    isFullResolved() {
        return !this.canceled;
    }
    payArrow(params) {
        const {ability} = this;

        if (ability && ability.arrow) {
            return ability.payArrow(params);
        }

        return true;
    }
    async payCost(params) {
        const {card} = this;
        const {player} = params;

        const cost = await this.getCost({
            ...params,
            card,
        }) + this.modifyCost;
        const normalizedCost = Math.max(0, cost);

        if (normalizedCost === 0 && !card.requirement?.length) {
            return;
        }

        const cardsToPay = await player.getCardsToPay(card);
        const response = await this.openDialog({
            dialogType: DIALOG_PAY_COST,
            showCancel: true,
            data: {
                cost: normalizedCost,
                requirement: card.requirement,
                card: card.toObj(),
                cards: {
                    generators: cardsToPay.generators
                        .map(_card => _card.toObj(arguments[0])),
                    hand: cardsToPay.hand
                        .map(_card => _card.toObj({card})),
                }
            },
        });

        if (response) {
            const {paid, resources} = response;

            this.resourcesPaid = resources;
            this.cardsPaid = {
                hand: paid.hand
                    .map(card => player.hand.getCard(card.id)),
                generators: paid.generators
                    .map(card => player.getCard(card.id)),
            };
        } else {
            this.canceled = true;
        }
    }
    async prepare(params) {
        const {card} = this;
        const {player} = params;

        card.isPlaying = true;
        this.removedFromHand = player.hand.cards.includes(card);
        if (this.removedFromHand) {
            player.hand.discardHand(card);
            await player.hand.refresh();
        }

        await super.prepare(params);
    }
    async returnToHand(player) {
        const {card} = this;

        card.isPlaying = false;
        if (this.removedFromHand) {
            if (!player.hand.cards.includes(card)) {
                player.hand.addCard(card);
            }
            this.removedFromHand = false;
            await player.hand.refresh();
        }
    }
    async runEffect(params) {
        try {
            await super.runEffect(params);
        } finally {
            if (!this.played) {
                this.canceled = true;
                await this.returnToHand(params.player);
            }
        }
    }
    selectAbility() {
        return new Promise(resolve => {
            const {card} = this;

            if (card.isEvent) {
                if (card.abilities.length > 1) {
                    // TODO: Implement dialog to select ability when event has multiple abilities
                    console.error('ELEGIR CAPACIDAD (MULTIPLE ABILITIES NOT YET SUPPORTED)');
                    return resolve(card.abilities[0]);
                } else {
                    return resolve(card.abilities[0]);
                }
            } else {
                return resolve();
            }
        });
    }
    async execute(params) {
        const {card, selectedTarget, target} = this;

        if (!this.ability) {
            this.ability = await this.selectAbility(params);
        }

        if (target && (selectedTarget === null || selectedTarget === undefined)) {
            this.canceled = true;
            card.isPlaying = false;
            return;
        }

        const abilityState = this.ability ?
            await this.ability.prepareToResolve(params) :
            {
                canRun: true,
                preselectedTarget: false,
            };

        if (!abilityState.canRun) {
            this.canceled = true;
            card.isPlaying = false;
            return;
        }

        await this.payCost(params);

        if (this.canceled) {
            card.isPlaying = false;
        } else {
            if (await this.payArrow(params)) {
                await this.doPlay({
                    ...params,
                    card,
                    preselectedTarget: abilityState.preselectedTarget,
                    arrowPaid: true,
                });
            } else {
                this.canceled = true;
                card.isPlaying = false;
            }
        }
    }
}