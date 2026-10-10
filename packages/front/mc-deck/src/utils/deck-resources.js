export function getPrintedResourceTypes(resources) {
    if (!Array.isArray(resources)) {
        return [];
    }

    const printedResources = [];

    for (const resource of resources) {
        if (typeof resource === 'string') {
            printedResources.push(resource);
            continue;
        }

        if (resource && typeof resource === 'object' && !resource.condition) {
            if (Array.isArray(resource.resources)) {
                printedResources.push(...resource.resources);
            }
            break;
        }
    }

    return printedResources;
}
