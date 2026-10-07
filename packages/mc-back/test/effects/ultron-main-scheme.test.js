import assert from 'node:assert/strict';
import {test} from 'node:test';

import {EFFECT_CANNOT_TARGET, EFFECT_REMOVE_THREAT, TARGET_SCHEME} from 'mc-shared';
import ultron from '../../../mc-data/seed/catalog/scenarios/ultron.js';
import {RemoveThreatEffect} from '../../src/effects/remove-threat-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

test('Cuenta atrás para el olvido cannot be thwarted while other schemes remain valid targets', async () => {
    const match = {
        hasCrisis: false,
        schemes: [],
        triggerCards: {},
    };
    const cardsFactory = new CardsFactory({match});
    const schemeSides = cardsFactory.createSides(
        structuredClone(ultron.config.mainSchemes[2])
    );
    const scheme = cardsFactory.createCardSides(schemeSides);
    scheme.selectedSide = 1;

    const mainScheme = scheme.currentSide;
    mainScheme.threat = 5;

    const sideScheme = {
        abilities: [],
        canRemoveThreat: () => true,
        isMainScheme: false,
    };
    match.schemes = [mainScheme, sideScheme];

    const thwart = new RemoveThreatEffect({
        match,
        target: TARGET_SCHEME,
        threat: 1,
    });

    assert.equal(thwart.effectType, EFFECT_REMOVE_THREAT);
    assert.equal(mainScheme.abilities[0].validation.effectType, EFFECT_CANNOT_TARGET);
    assert.deepEqual(await thwart.getValidTarget({player: {}}), [sideScheme]);
});
