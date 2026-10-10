import {AddAccelerationTokenEffect} from './add-acceleration-token-effect.js';
import {DealEncounterEffect} from './deal-encounter-effect.js';
import {Effect} from './effect.js';

export class CycleEffect extends Effect {
    async execute(_params) {
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
            const addAccelerationTokenEffect = new AddAccelerationTokenEffect({
                selectedTarget: this.match.mainScheme,
                match: this.match,
            });

            await addAccelerationTokenEffect.runEffect({
                player: selectedTarget.owner,
            });
        }

        selectedTarget.cycle();
        selectedTarget.refresh();
    }
}