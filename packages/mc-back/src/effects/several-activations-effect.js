import {ValidTarget} from '../targets/valid-target.js';

import {ActivateEffect} from './activate-effect.js';
import {PlayPhaseEffect} from './play-phase-effect.js';

export class SeveralActivationsEffect extends PlayPhaseEffect {
    constructor({
        enemiesType,
        enemies,
    }) {
        super(arguments[0]);

        this.enemiesType = enemiesType;
        this.enemies = enemies;
    }
    async prepare(params) {
        await super.prepare(params);

        if (!this.enemies) {
            const {enemiesType} = this;
            const {player} = params;

            const validTarget = new ValidTarget({
                match: this.match,
                multipleTarget: true,
            });
            this.enemies = await validTarget.selectTarget({
                target: enemiesType,
                player,
            });
        }
    }
    activate(enemy, params) {
        const activateEffect = new ActivateEffect({
            selectedTarget: enemy,
            match: this.match,
        });

        return activateEffect.runEffect(params);
    }
    execute(params) {
        const {enemies} = this;

        return this.promisesSequential(enemies, enemy => this.activate(enemy, params));
    }
}