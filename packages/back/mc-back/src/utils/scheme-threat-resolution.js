import {EFFECT_DEFEAT} from 'mc-shared';

export async function completeMainSchemeIfThresholdReached(scheme, match, params) {
    if (!scheme.isMainScheme || scheme.threat < scheme.value) {
        return false;
    }

    await match.scenario.completeMainScheme(scheme, params);

    return true;
}

export async function defeatSideSchemeIfEmpty(scheme, match, ability, params) {
    if (!scheme.isSideScheme || scheme.threat > 0) {
        return false;
    }

    const defeatEffect = match.effectsFactory.createEffect({
        type: EFFECT_DEFEAT,
        selectedTarget: scheme,
        ability,
    });
    await defeatEffect.runEffect(params);
}
