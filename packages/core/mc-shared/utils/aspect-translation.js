export const ASPECT_NAMES = {
    aggression: 'Agresividad',
    basic: 'Básica',
    justice: 'Justicia',
    leadership: 'Liderazgo',
    pool: 'Masacrismo',
    protection: 'Protección',
};

export function translateAspect(aspect) {
    return Object.hasOwn(ASPECT_NAMES, aspect) ? ASPECT_NAMES[aspect] : aspect;
}
