import {Effect} from './effect.js';

export class WinGameEffect extends Effect {
    execute() {
        return this.match.scenario.winGame();
    }
}
