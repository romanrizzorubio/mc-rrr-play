import {STATUS_NONE} from "../../../constants/status.js";

export const MixinCharacterCard = C => class extends C {
    constructor({
// MixinCharacterCard
        hitPoints,
        statusAvailable = STATUS_NONE,
        maxTough = 1
    }) {
        super(arguments[0]);

        this._hitPoints = hitPoints;
        this.statusAvailable = statusAvailable;
        this.maxTough = maxTough;

        this.isCharacter = true;
    }
    get hitPoints() {
        if (this._hitPoints instanceof Array) {
            const [hitPoints, perPlayer] = this._hitPoints;

            return perPlayer ? hitPoints * this.match.numPlayers : hitPoints;
        }

        return this._hitPoints;
    }
    toObj() {
        return {
            ...super.toObj(arguments[0])
        }
    }
}