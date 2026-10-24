import {
    DIALOG_ENCOUNTERS_REVEAL,
    TRIGGER_ENGAGE_HERO,
} from 'mc-shared';

import {PutPlayEffect} from './put-play-effect.js';


export class EngageEffect extends PutPlayEffect {
    constructor({
        deferEngageHeroTrigger = false,
        cardShownInRevealDialog = false,
    }) {
        super(arguments[0]);

        this.deferEngageHeroTrigger = deferEngageHeroTrigger;
        this.cardShownInRevealDialog = cardShownInRevealDialog;
        this.didEngage = false;
        this.enteredPlay = false;
    }
    getCard(params = {}) {
        return super.getCard(params) ||
            (params.card?.isMinion ? params.card : undefined);
    }
    getController(params) {
        return this.controller || this.selectedTarget || params.player;
    }
    async canRun(params) {
        this.didEngage = false;
        this.enteredPlay = false;

        const card = this.getCard(params);
        if (card?.isMinion &&
            card.isInPlay &&
            card.engaged === this.selectedTarget) {
            return false;
        }

        return super.canRun(params);
    }
    getTriggersEnds(params) {
        const triggerTypes = this.enteredPlay ?
            super.getTriggersEnds(params) :
            [];
        if (!this.didEngage || !this.getCard(params)?.isMinion) {
            return triggerTypes;
        }

        return this.deferEngageHeroTrigger ?
            triggerTypes :
            triggerTypes.concat([TRIGGER_ENGAGE_HERO]);
    }
    isResolved() {
        return this.didEngage && super.isResolved();
    }
    getTriggersParams(params) {
        return {
            ...super.getTriggersParams(params),
            card: this.getCard(params),
        };
    }
    async resolveDeferredEngageHeroTrigger(params) {
        if (!this.deferEngageHeroTrigger ||
            !this.didEngage ||
            !this.resolved) {
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
        this.didEngage = false;
        this.enteredPlay = false;

        const card = this.getCard(params);
        if (!card) {
            return;
        }
        if (!card.isMinion) {
            throw new Error('Only minions can be engaged.');
        }

        const {selectedTarget} = this;
        const wasInPlay = card.isInPlay;
        const controller = this.getController(params);
        if (!selectedTarget || typeof selectedTarget.engage !== 'function') {
            throw new Error('EngageEffect requires a player target.');
        }
        if (wasInPlay && card.engaged === selectedTarget) {
            return;
        }

        await super.execute(params);
        if (!wasInPlay && !card.controller) {
            return;
        }

        const previousPlayer = card.engaged;
        if (previousPlayer) {
            previousPlayer.removeEngaged(card);
        }
        card.controller = controller;
        selectedTarget.engage(card);
        card.engaged = selectedTarget;
        this.didEngage = true;
        this.enteredPlay = !wasInPlay;

        await selectedTarget.refresh();

        if (this.enteredPlay && !this.cardShownInRevealDialog) {
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