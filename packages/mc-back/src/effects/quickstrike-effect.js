import {EnemyAttackEffect} from "./enemy-attack-effect.js";
import {Effect} from "./effect.js";
import {Ability} from "../abilities/core/ability.js";

export class QuickStrikeEffect extends Effect {
    constructor({
        minion,
    }) {
        super(arguments[0]);

        this.minion = minion;
    }
    async execute(params) {
        const {minion, selectedTarget} = this;
        const {player} = params;

        const enemyAttackEffect = new EnemyAttackEffect({
            selectedTarget,
            match: this.match,
            enemy: minion,
        });

        const ability = new Ability({
            effect: enemyAttackEffect,
            card: minion,
            match: this.match,
        });

        return ability.resolveAbility({
            player,
        })
    }
}