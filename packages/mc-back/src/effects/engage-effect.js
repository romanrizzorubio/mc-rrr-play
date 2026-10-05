import {TRIGGER_ENGAGE_HERO} from 'mc-shared';

import {PutPlayEffect} from './put-play-effect.js';


export class EngageEffect extends PutPlayEffect {
    getController(params) {
        return this.controller || this.selectedTarget || params.player;
    }
    getTriggersEnds(params) {
        if (!this.getCard(params)?.isMinion) {
            return [];
        }

        return super.getTriggersEnds(params)
            .concat([
                TRIGGER_ENGAGE_HERO,
            ]);
    }
    getTriggersParams(params) {
        return {
            ...super.getTriggersParams(params),
            card: this.getCard(params),
        };
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
        if (!selectedTarget || typeof selectedTarget.engage !== 'function') {
            throw new Error('EngageEffect requires a player target.');
        }

        await super.execute(params);

        selectedTarget.engage(card);
        card.engaged = selectedTarget;

        await selectedTarget.refresh();
    }
}