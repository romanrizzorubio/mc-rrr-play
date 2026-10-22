function getDefenseAttackEffect(params) {
    const triggeringEffect = params.triggeredEffect || params.effect;
    const enemyActivation = triggeringEffect?.enemyActivation;

    if (enemyActivation) {
        return enemyActivation;
    }

    if (typeof triggeringEffect?.setDefenderByAbility === 'function') {
        return triggeringEffect;
    }

    const activationEffect = triggeringEffect?.activation?.effect;

    return activationEffect?.enemyActivation ||
        activationEffect ||
        triggeringEffect;
}

function getAbilityPlayer(ability, params) {
    if (ability.card?.isEvent) {
        return params.player;
    }

    const character = ability.character;
    if (character?.isPlayer) {
        return character;
    }
    if (character?.controller?.isPlayer) {
        return character.controller;
    }
    if (character?.owner?.isPlayer) {
        return character.owner;
    }

    return params.player;
}

export const MixinTriggeableAbility = C => class extends C {
    constructor({
        trigger,
        triggerParams,
    }) {
        super(arguments[0]);

        this.trigger = trigger;
        this.triggerParams = triggerParams;
    }
    canRun(params, effect = this.effect) {
        if (!this.isValidIdentity(params)) {
            return false;
        }

        if (this.isDefense) {
            const attackEffect = getDefenseAttackEffect(params);
            if (typeof attackEffect?.canUseDefenseAbility === 'function' &&
                !attackEffect.resolved &&
                !attackEffect.canUseDefenseAbility(getAbilityPlayer(this, params))) {
                return false;
            }
        }

        return super.canRun(params, effect);
    }
    async onResolutionStart(params) {
        await super.onResolutionStart(params);

        if (!this.isDefense) {
            return;
        }

        const attackEffect = getDefenseAttackEffect(params);
        if (typeof attackEffect?.setDefenderByAbility === 'function') {
            await attackEffect.setDefenderByAbility(
                getAbilityPlayer(this, params),
                params
            );
        }
    }
    canTrigger(params) {
        return this.canRun(params);
    }
};