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
        const wasEnemy = params.effect.defeatedCharacterState?.isEnemy ??
            enemy.isEnemy;

        if (wasEnemy) {
            return super.canTrigger(params);
        }

        return false;
    }
};