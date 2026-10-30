import {ValidTarget} from '../targets/valid-target.js';
import {checkCondition} from '../engine/utils.js';

import {ActivateEffect} from './activate-effect.js';
import {Effect} from './effect.js';

export class SeveralActivationsEffect extends Effect {
    static isSameEnemy(first, second) {
        return first === second ||
            (first.isVillain && second.isVillain &&
                first.name === second.name &&
                first.scenarioZone === second.scenarioZone);
    }
    constructor({
        enemiesType,
        enemies,
        enemiesCondition,
    }) {
        super(arguments[0]);

        this.enemiesType = enemiesType;
        this.enemies = enemies;
        this.enemiesCondition = enemiesCondition;
        this.enemiesFromTarget = enemies === undefined;
    }
    async prepare(params) {
        await super.prepare(params);

        this.enemies = this.getEnemies(params);
    }
    getEnemies(params) {
        let enemies = this.enemies || [];
        if (this.enemiesFromTarget) {
            const {enemiesType} = this;
            const {player} = params;

            const validTarget = new ValidTarget({
                effect: this,
                match: this.match,
                multipleTarget: true,
                condition: this.condition,
            });
            enemies = validTarget.getValidTarget({
                ...params,
                ability: this.ability,
                target: enemiesType,
                player,
            });
        }

        if (this.enemiesCondition) {
            enemies = enemies.filter(enemy =>
                checkCondition(enemy, this.enemiesCondition));
        }

        return enemies;
    }
    activate(enemy, params) {
        const activateEffect = new ActivateEffect({
            selectedTarget: enemy,
            match: this.match,
        });

        return activateEffect.runEffect(params);
    }
    async execute(params) {
        const selectionParams = {
            ...params,
            ability: this.ability,
            effect: this,
        };
        const activatedEnemies = new Set();

        while (!this.match.gameOverReason && !params.player?.defeated) {
            const availableEnemies = this.getEnemies(selectionParams).filter(enemy =>
                ![...activatedEnemies].some(activatedEnemy =>
                    SeveralActivationsEffect.isSameEnemy(enemy, activatedEnemy)) &&
                enemy.isInPlay !== false &&
                this.validTarget.filter(enemy, selectionParams)
            );
            if (!availableEnemies.length) {
                return;
            }

            const enemy = availableEnemies.length === 1 ?
                availableEnemies[0] :
                await this.validTarget.selectFrom(availableEnemies, {
                    ...selectionParams,
                    dialogTitle: 'Elige qué enemigo se activa',
                });
            if (!enemy) {
                throw new Error('SeveralActivationsEffect requires a valid enemy selection.');
            }

            if (this.match.gameOverReason || params.player?.defeated) {
                return;
            }
            activatedEnemies.add(enemy);
            await this.activate(enemy, params);
        }
    }
}