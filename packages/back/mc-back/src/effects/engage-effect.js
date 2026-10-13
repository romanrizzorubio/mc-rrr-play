import {
    DIALOG_ENCOUNTERS_REVEAL,
    TRIGGER_ENGAGE_HERO,
} from 'mc-shared';

import {PutPlayEffect} from './put-play-effect.js';


export class EngageEffect extends PutPlayEffect {
    constructor({
        deferEngageHeroTrigger = false,
    }) {
        super(arguments[0]);

        this.deferEngageHeroTrigger = deferEngageHeroTrigger;
    }
    getCard(params = {}) {
        return super.getCard(params) ||
            (params.card?.isMinion ? params.card : undefined);
    }
    getController(params) {
        return this.controller || this.selectedTarget || params.player;
    }
    getTriggersEnds(params) {
        if (!this.getCard(params)?.isMinion) {
            return [];
        }

        const triggerTypes = super.getTriggersEnds(params);

        return this.deferEngageHeroTrigger ?
            triggerTypes :
            triggerTypes.concat([TRIGGER_ENGAGE_HERO]);
    }
    getTriggersParams(params) {
        return {
            ...super.getTriggersParams(params),
            card: this.getCard(params),
        };
    }
    async resolveDeferredEngageHeroTrigger(params) {
        if (!this.deferEngageHeroTrigger || !this.resolved) {
            return;
        }

        await this.triggerEnds(
            this.getTriggersParams({
                ...params,
                player: this.selectedTarget,
            }),
            {
                triggerTypes: [TRIGGER_ENGAGE_HERO],
                resolveDelayedEffects: false,
            }
        );
    }
    async execute(params) {
        const card = this.getCard(params);
        if (!card) {
            return;
        }
        if (!card.isMinion) {
            throw new Error('Only minions can be engaged.');
        }

        const {selectedTarget} = this;
        const scenarioDeck = card.owner?.deck;
        const isFromScenarioDeck = Boolean(
            scenarioDeck?.isScenarioDeck &&
            (
                scenarioDeck.cards.includes(card) ||
                scenarioDeck.discardPile.includes(card)
            )
        );
        if (!selectedTarget || typeof selectedTarget.engage !== 'function') {
            throw new Error('EngageEffect requires a player target.');
        }

        await super.execute(params);

        selectedTarget.engage(card);
        card.engaged = selectedTarget;

        await selectedTarget.refresh();

        if (isFromScenarioDeck) {
            await this.openDialog({
                dialogType: DIALOG_ENCOUNTERS_REVEAL,
                title: 'Esbirro puesto en juego',
                data: {
                    card: card.toObj(params),
                },
            });
        }
    }
}