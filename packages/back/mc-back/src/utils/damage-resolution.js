import {EFFECT_DEFEAT} from 'mc-shared';

export function getDamageStatusTarget(target) {
    return target.isPlayer ?
        target.superhero.currentSide :
        target;
}

export async function isCharacterLethal(target) {
    if (typeof target?.getLife !== 'function') {
        throw new TypeError('A damage defeat check requires a target with getLife().');
    }

    return (await target.getLife()) <= 0;
}

export async function defeatCharacter(target, {
    match,
    ability,
    activation,
    params,
}) {
    const selectedTarget = target.isPlayer ?
        target.superhero.currentSide :
        target;
    const defeatEffect = match.effectsFactory.createEffect({
        type: EFFECT_DEFEAT,
        selectedTarget,
        ability,
        activation,
    });

    await defeatEffect.runEffect(params);

    return defeatEffect.defeated === true;
}

export async function defeatCharacterIfLethal(target, params) {
    return await isCharacterLethal(target) ?
        defeatCharacter(target, params) :
        false;
}

export function canResolveDamageWithStatus(target, {
    ignoreTough = false,
    piercing = false,
} = {}) {
    return ignoreTough ||
        piercing ||
        Array.isArray(target) ||
        !getDamageStatusTarget(target).isTough;
}

export function resolveDamageStatus(target, {ignoreTough = false} = {}) {
    if (ignoreTough) {
        return;
    }

    const statusTarget = getDamageStatusTarget(target);
    statusTarget.removeTough();

    return statusTarget.refresh();
}

export async function resolveToughDamage({
    targets,
    damage,
    preventDamage,
    getStatusTarget = getDamageStatusTarget,
    ignoreTough = false,
    piercing = false,
}) {
    const damages = Array.isArray(damage) ?
        damage.slice() :
        targets.map(() => damage);
    const preventions = Array.isArray(preventDamage) ?
        preventDamage :
        targets.map(() => preventDamage ?? 0);
    let hasDamage = false;

    for (let index = 0; index < targets.length; index++) {
        const target = targets[index];
        const statusTarget = getStatusTarget(target);
        const prevented = preventions[index] || 0;

        if (!ignoreTough &&
            statusTarget.isTough &&
            damages[index] - prevented > 0) {
            statusTarget.removeTough();
            await statusTarget.refresh();
            if (!piercing) {
                damages[index] = prevented;
            }
        }

        if (damages[index] - prevented > 0) {
            hasDamage = true;
        }
    }

    return {
        damage: Array.isArray(damage) ? damages : damages[0],
        hasDamage,
    };
}
