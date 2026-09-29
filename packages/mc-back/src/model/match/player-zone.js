import {GameZone} from "./game-zone.js";
import {path} from "../../engine/utils.js";

export class PlayerZone extends GameZone {
    constructor({owner}) {
        super(arguments[0]);

        this.minions = [];
        this.encounters = [];
    }
    engage(minion) {
        this.minions.push(minion);
    }
    get hasCrisis() {
        return this.minions.some(minion => minion.hasCrisis) ||
            super.hasCrisis;
    }
    get hasGuard() {
        return this.minions.some(minion => minion.guard)
    }
    get hasPatrol() {
        return this.minions.some(minion => minion.patrol)
    }
    get hazardIcons() {
        let hazardIcons = 0;

        this.minions.forEach(minion => {
            hazardIcons += minion.hazardIcons;
        });

        return hazardIcons + super.hazardIcons;
    }
    get objectToRefresh() {
        return 'playerZone';
    }
    removeEngaged(minion) {
        if (minion) {
            const index = this.minions.indexOf(minion);
            if (index > -1) {
                this.minions.splice(index, 1);
            }
        }
    }
    toObj() {
        const {minions, encounters} = this;

        return {
            ...super.toObj(arguments[0]),
            minions: minions.map(minion => minion.toObj(arguments[0])),
            encounters: encounters.length,
        }
    }
}