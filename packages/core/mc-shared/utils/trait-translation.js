const TRAIT_LABELS = {
    aerial: 'Aéreo',
    armor: 'Armadura',
    attack: 'Ataque',
    avenger: 'Vengador',
    businessman: 'Empresario',
    condition: 'Alteración',
    defender: 'Defensor',
    defense: 'Defensa',
    droid: 'Androide',
    goblin: 'Duende',
    location: 'Lugar',
    skill: 'Habilidad',
    spy: 'Espía',
    tactic: 'Táctica',
    thwart: 'Intervención',
    title: 'Título',
    vehicle: 'Vehículo',
};

export function translateTrait(trait) {
    return Object.hasOwn(TRAIT_LABELS, trait) ? TRAIT_LABELS[trait] : trait;
}
