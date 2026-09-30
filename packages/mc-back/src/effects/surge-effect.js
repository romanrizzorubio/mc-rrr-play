import {Effect} from './effect.js';

export class SurgeEffect extends Effect {
    execute(params) {
        const {reveal} = params;

        reveal.surge = true;
    }
}