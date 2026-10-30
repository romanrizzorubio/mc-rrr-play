import {AddAccelerationTokenEffect} from './add-acceleration-token-effect.js';
import {DealEncounterEffect} from './deal-encounter-effect.js';
import {Effect} from './effect.js';
import {getMainSchemeFor} from '../utils/match-zone-utils.js';

export class CycleEffect extends Effect {
    async execute(params) {
        const {selectedTarget} = this;

        if (selectedTarget.isPlayerDeck) {
            const dealEncounterEffect = new DealEncounterEffect({
                selectedTarget: selectedTarget.owner,
                match: this.match,
            });

            await dealEncounterEffect.runEffect({
                player: selectedTarget.owner,
            });
        } else if (selectedTarget.isScenarioDeck) {
            const mainScheme = getMainSchemeFor(this.match, params.player);
            if (mainScheme && !mainScheme.isPlayer) {
                const addAccelerationTokenEffect = new AddAccelerationTokenEffect({
                    selectedTarget: mainScheme,
                    match: this.match,
                });

                await addAccelerationTokenEffect.runEffect({
                    player: params.player ?? this.match.initialPlayer,
                });
            }
        } else if (selectedTarget.isPlayerExtraDeck) {
            selectedTarget.cycle();
        }

        if (!selectedTarget.isPlayerExtraDeck) {
            selectedTarget.cycle();
        }
        selectedTarget.refresh();
    }
}