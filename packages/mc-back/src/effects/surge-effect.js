import {Effect} from "./effect.js";

export const EFFECT_SURGE = 'surge';
export class SurgeEffect extends Effect {
    execute(params) {
        const {reveal} = params;

        reveal.surge = true;
    }
}