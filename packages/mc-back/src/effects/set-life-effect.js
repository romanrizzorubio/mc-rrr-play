import {Effect} from './effect.js';

export class SetLifeEffect extends Effect {
    constructor(params) {
        super(params);

        const {life} = params;
        if (!Number.isSafeInteger(life) || life < 0) {
            throw new RangeError('life must be a non-negative safe integer.');
        }

        this.life = life;
    }
    async execute(params) {
        const targets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget :
            [this.selectedTarget];
        const updates = [];

        for (const target of targets) {
            if (!target ||
                typeof target.getHitPoints !== 'function' ||
                typeof target.refresh !== 'function' ||
                !('damage' in target)) {
                throw new TypeError('SetLifeEffect targets must be characters.');
            }

            const hitPoints = await target.getHitPoints(params);
            if (!Number.isFinite(hitPoints) || this.life > hitPoints) {
                throw new RangeError('life cannot exceed the target hit points.');
            }

            updates.push({
                target,
                damage: hitPoints - this.life,
            });
        }

        for (const {target, damage} of updates) {
            target.damage = damage;
            await target.refresh();
        }
    }
}
