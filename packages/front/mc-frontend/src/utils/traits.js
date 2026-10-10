const TRAIT_LABELS = {
    avenger: 'Vengador',
};

export function translateTrait(trait) {
    return TRAIT_LABELS[trait] || trait;
}
