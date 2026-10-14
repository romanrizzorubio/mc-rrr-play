import {TARGET_MAIN_SCHEME} from 'mc-shared';

import {PlaceThreatEffect} from '../../effects/place-threat-effect.js';
import {WhenRevealedAbility} from '../when/when-revealed-ability.js';

export class InciteAbility extends WhenRevealedAbility {
    constructor({card, match}) {
        super({
            card,
            effect: new PlaceThreatEffect({
                match,
                target: TARGET_MAIN_SCHEME,
                threat: card.incite,
            }),
            hideDialog: true,
            match,
            name: 'Incitar',
        });
    }
}
