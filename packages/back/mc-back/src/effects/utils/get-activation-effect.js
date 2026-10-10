export const getActivationEffect = (params, selectedTarget) => {
    const selectedTargets = Array.isArray(selectedTarget) ?
        selectedTarget :
        [selectedTarget];
    const candidates = [
        params.attack?.effect,
        params.effect,
        ...selectedTargets,
    ];

    return candidates.find(candidate =>
        typeof candidate?.cancelActivation === 'function'
    );
};
