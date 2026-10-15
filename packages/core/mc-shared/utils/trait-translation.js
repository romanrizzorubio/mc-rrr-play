const TRAIT_LABELS = {
    aerial: 'Aéreo',
    asgard: 'Asgard',
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
    experimental: 'Experimental',
    giant: 'Gigante',
    goblin: 'Duende',
    hydra: 'Hydra',
    inhuman: 'Inhumano',
    location: 'Lugar',
    olympus: 'Olimpo',
    persona: 'Individuo',
    skill: 'Habilidad',
    spy: 'Espía',
    tactic: 'Táctica',
    thwart: 'Intervención',
    title: 'Título',
    vehicle: 'Vehículo',
    robot: 'Robot',
    weapon: 'Arma',
};

export function translateTrait(trait) {
    return Object.hasOwn(TRAIT_LABELS, trait) ? TRAIT_LABELS[trait] : trait;
}
