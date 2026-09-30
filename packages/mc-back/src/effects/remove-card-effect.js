import {Effect} from './effect.js';

export class RemoveCardEffect extends Effect {
    async execute() {
        const {selectedTarget} = this;

        await selectedTarget.remove();

        selectedTarget.refresh();
    }
}