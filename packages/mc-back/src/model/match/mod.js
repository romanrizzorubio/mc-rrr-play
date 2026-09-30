import {Engine} from '../../engine/engine.js';

export class Mod extends Engine {
    constructor({
// Mod
        name,
        modCards
    }) {
        super();

        this.name = name;
        this.modCards = modCards;
    }
}