const movementTriggerContexts = new WeakMap();

export function getMovementTriggerContext(effect, {
    getSourceTarget,
    getDestinationTarget,
}) {
    let context = movementTriggerContexts.get(effect);

    if (!context) {
        context = {
            getDestinationTarget,
            getSourceTarget,
        };
        context.effect = new Proxy(effect, {
            get(target, property, receiver) {
                if (property === 'sourceTarget') {
                    return context.getSourceTarget();
                }

                if (property === 'destinationTarget' || property === 'selectedTarget') {
                    return context.getDestinationTarget();
                }

                return Reflect.get(target, property, receiver);
            },
            set(target, property, value) {
                return Reflect.set(target, property, value, target);
            },
        });
        movementTriggerContexts.set(effect, context);
    }

    context.getDestinationTarget = getDestinationTarget;
    context.getSourceTarget = getSourceTarget;

    return context.effect;
}
