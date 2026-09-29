import {DoIfEffect} from "./do-if-effect.js";
import {PLACE_SCENARIO_ZONE} from "../constants/places.js";
import {TARGET_CARD} from "../constants/targets.js";
import {checkCondition} from "../engine/utils.js";

export const EFFECT_DO_IF_CARD_GAME = 'do-if-card-game';
export class DoIfCardGameEffect extends DoIfEffect {
    constructor({
// DoIfEffect
        condition,
        effect,
        effectNot
    }) {
        super(arguments[0]);

        this.condition = condition;
    }
    checkCondition(params) {
        params.cardCondition = this.match.searchCard(this.condition);

        return params.cardCondition;
    }
}