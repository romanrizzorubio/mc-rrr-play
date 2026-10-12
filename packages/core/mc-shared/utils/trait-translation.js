const TRAIT_LABELS = {
    aerial: 'Aéreo',
    armor: 'Armadura',
    attack: 'Ataque',
    avenger: 'Vengador',
    bird: 'Pájaro',
    businessman: 'Empresario',
    champion: 'Campeón',
    condition: 'Alteración',
    defender: 'Defensor',
    defense: 'Defensa',
    droid: 'Androide',
    goblin: 'Duende',
    inhuman: 'Inhumano',
    location: 'Lugar',
    persona: 'Individuo',
    skill: 'Habilidad',
    spy: 'Espía',
    tactic: 'Táctica',
    thwart: 'Intervención',
    title: 'Título',
    vehicle: 'Vehículo',
    robot: 'Robot',
};

export function translateTrait(trait) {
    return Object.hasOwn(TRAIT_LABELS, trait) ? TRAIT_LABELS[trait] : trait;
}
