import {EVENTS} from 'mc-endpoints';

import {GameCard} from './game-card.js';

export class SchemeGameCard extends GameCard {
    constructor({
// GameCard
        card: _card, index: _index
    }) {
        super(arguments[0]);

        this.threat = 0;
    }
    get accelerationValue() {
        return this.card.acceleration;
    }
    get accelerationCalc() {
        return this.card.accelerationCalc;
    }
    get content() {
        return this.card.content;
    }
    get final() {
        return this.card.final;
    }
    get gameZone() {
        if (this.isSideScheme) {
            return this.match.scenario.gameZone;
        }
    }
    get initial() {
        return this.card.initial;
    }
    get isMain() {
        return this.card.isMain;
    }
    get value() {
        if (this.sides.length) {
            return this.currentSide.value;
        }

        const attached = new Set([
            ...(this.attached ?? []),
            ...(this.parent?.attached ?? []),
        ]);
        const modifier = this.isMainScheme ?
            [...attached].reduce((sum, card) =>
                sum + (card.card?.threatThresholdModifier ?? 0), 0) :
            0;

        return this.card.value + modifier;
    }
    acceleration(match) {
        let value = this.accelerationValue(match.numPlayers);

        value += match.accelerationPlus;
        
        this.placeThreat(value, match.numPlayers);
    }
    canRemoveThreat({ignoreCrisis = false} = {}) {
        if (this.threat > 0) {
            if (this.isMainScheme) {
                if (ignoreCrisis || !this.match.hasCrisis) {
                    return true;
                }
            } else {
                return true;
            }
        }

        return false;
    }
    canScheme() {
        return true;
    }
    canThwart(player, {ignoreCrisis = false} = {}) {
        if (this.canRemoveThreat({ignoreCrisis})) {
            if (!player.hasPatrol) {
                return true;
            }
        }

        return false;
    }
    defeat() {
        if (this.isMain) {
            this.match.mc.mcSocket.send(
                this.match.name,
                EVENTS.CARD.DEFEAT,
                this.toObj()
            );
        }

        return super.defeat();
    }
    initScheme() {
        this.threat = this.initial;
    }
    placeThreat(threat) {
        const value = this.calcPerPlayer(threat);

        this.threat += value > 0 ? value : 0;

        if (this.threat < 0) {
            this.threat = 0;
        }
    }
    placeThreatFromScheme(threat, numPlayers) {
        this.placeThreat(threat, numPlayers);
    }
    removeThreat(threat) {
        this.threat -= threat;

        if (this.threat < 0) {
            this.threat = 0;
        }
    }
    removeThreatFromThwart(threat) {
        this.removeThreat(threat);
    }
    toObj() {
        const {threat, sides} = this;

        if (sides.length) {
            return {
                ...this.currentSide.toObj(arguments[0]),
            };
        }

        return {
            ...super.toObj(arguments[0]),
            ...(this.isMainScheme ? {value: this.value} : {}),
            threat
        };
    }
}