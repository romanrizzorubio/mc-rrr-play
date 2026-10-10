export function normalizeResourceTypes(resourceType) {
    if (resourceType === undefined || resourceType === null) {
        return [];
    }

    return Array.isArray(resourceType) ? resourceType : [resourceType];
}
