import {
    DIALOG_LIST,
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
} from 'mc-shared';
import {findResourceAssignment} from './find-resource-assignment.js';

export function canPayResourceRequirements(
    cardsToPay,
    requirements,
    cardToPay,
    player,
    {sameType = false, differentTypes = false} = {}
) {
    const paymentSources = [...(cardsToPay.hand || [])];

    (cardsToPay.generators || []).forEach(generator => {
        const ability = generator.abilities?.find(({isResource}) => isResource);
        if (!ability) {
            return;
        }

        const resourcePlayer = generator.controller ||
            generator.owner ||
            player;
        const resources = typeof ability.getGeneratedResources === 'function' ?
            ability.getGeneratedResources({
                card: generator,
                cardToPay,
                player: resourcePlayer,
            }) :
            ability.resources || (ability.resource ? [ability.resource] : []);
        if (!Array.isArray(resources)) {
            throw new TypeError('Generated resource icons must resolve to an array.');
        }

        paymentSources.push({resources});
    });

    return Boolean(findResourceAssignment(
        paymentSources,
        requirements,
        undefined,
        {cardToPay, sameType, differentTypes}
    ));
}

export async function showInsufficientResourceCostDialog(
    openDialog,
    player,
    cardToPay,
    {
        sameType = false,
        differentTypes = false,
        requirements = [],
    } = {}
) {
    const resourceTypes = [
        RESOURCE_ENERGY,
        RESOURCE_MENTAL,
        RESOURCE_PHYSICAL,
        RESOURCE_WILD,
    ];
    const typeRequirements = [...new Set(requirements.map(requirement => {
        const alternatives = Array.isArray(requirement) ?
            requirement :
            [requirement];
        const types = alternatives.includes(RESOURCE_ANY) ?
            [] :
            [...new Set(alternatives.filter(type =>
                resourceTypes.includes(type)))];

        return types.map(type => `[${type}]`).join(' o ');
    }).filter(Boolean))];
    const iconDescription = typeRequirements.join(' y ');
    const resourceDescription = sameType ?
        iconDescription ?
            `${iconDescription} del mismo tipo` :
            'del mismo tipo' :
        differentTypes ?
            iconDescription ?
                `${iconDescription} de tipos distintos` :
                'de tipos distintos' :
            iconDescription ?
                `de tipo ${iconDescription}` :
                undefined;
    const card = typeof cardToPay?.toObj === 'function' ?
        cardToPay.toObj() :
        undefined;

    await openDialog({
        dialogType: DIALOG_LIST,
        targetPlayer: player,
        hideViewTable: true,
        title: 'Coste no pagado',
        subtitle: resourceDescription ?
            `No tienes suficientes recursos ${resourceDescription} para pagar este coste.` :
            'No tienes suficientes recursos para pagar este coste.',
        data: card ? {card} : {},
    });
}
