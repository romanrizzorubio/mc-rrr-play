import {ValidTarget} from '../targets/valid-target.js';
import {checkCondition} from '../engine/utils.js';

import {ActivateEffect} from './activate-effect.js';
import {PlayPhaseEffect} from './play-phase-effect.js';

export class SeveralActivationsEffect extends PlayPhaseEffect {
    constructor({
        enemiesType,
        enemies,
        enemiesCondition,
    }) {
        super(arguments[0]);

        this.enemiesType = enemiesType;
        this.enemies = enemies;
        this.enemiesCondition = enemiesCondition;
    }
    async prepare(params) {
        await super.prepare(params);

        if (!this.enemies) {
            const {enemiesType} = this;
            const {player} = params;

            const validTarget = new ValidTarget({
                effect: this,
                match: this.match,
                multipleTarget: true,
                condition: this.condition,
            });
            this.enemies = await validTarget.selectTarget({
                ...params,
                ability: this.ability,
                target: enemiesType,
                player,
            });
        }

        if (this.enemiesCondition) {
            this.enemies = this.enemies.filter(enemy =>
                checkCondition(enemy, this.enemiesCondition));
        }
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
        let enemies = [...(this.enemies || [])];

        while (enemies.length) {
            const availableEnemies = enemies.filter(enemy =>
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

            enemies = enemies.filter(candidate => candidate !== enemy);
            await this.activate(enemy, params);
        }
    }
}