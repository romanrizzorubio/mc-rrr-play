import {GameCard} from "./game-card.js";
import {endpoints} from "../../constants/endpoints.js";

export class SchemeGameCard extends GameCard {
    constructor({
// GameCard
        card, index
    }) {
        super(arguments[0]);

        this.threat = 0;
    }
    get accelerationValue() {
        return this.card.acceleration;
    }
    get content() {
        return this.card.content;
    }
    get gameZone() {
        if (this.isSideScheme) {
            return this.match.scenario.gameZone;
        } else {
            console.log(this);
        }
    }
    get initial() {
        return this.card.initial;
    }
    get isMain() {
        return this.card.isMain;
    }
    get value() {
        return this.card.value;
    }
    acceleration(match) {
        let value = this.accelerationValue(match.numPlayers);

        value += match.accelerationPlus;
        
        this.placeThreat(value, match.numPlayers);
    }
    canRemoveThreat() {
        if (this.threat > 0) {
            if (this.isMainScheme) {
                if (!this.match.hasCrisis) {
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
    canThwart(player) {
        if (this.canRemoveThreat()) {
            if (!player.hasPatrol) {
                return true;
            }
        }

        return false;
    }
    defeat() {
        if (this.isMain) {
            this.match.mc.send(endpoints.card.defeat, this.toObj());
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
            }
        }

        return {
            ...super.toObj(arguments[0]),
            threat
        }
    }
}