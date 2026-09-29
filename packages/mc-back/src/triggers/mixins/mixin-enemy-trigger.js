export const MixinEnemyTrigger = C => class extends C {
    constructor(params) {
        super(params);
    }
    getEnemy(params) {
        const {effect} = params;

        return effect.selectedTarget;
    }
    canTrigger(params) {
        const enemy = this.getEnemy(params);

        if (enemy.isEnemy) {
            return super.canTrigger(params);
        }

        return false;
    }
}