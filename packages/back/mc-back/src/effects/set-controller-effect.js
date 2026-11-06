import {Effect} from './effect.js';
import {path} from '../engine/utils.js';

export class SetControllerEffect extends Effect {
    constructor({controller}) {
        super(arguments[0]);

        this.controller = controller;
    }
    getController(params) {
        const controller = typeof this.controller === 'string' ?
            path({
                ...params,
                match: params.match ?? this.match,
            }, this.controller) :
            this.controller;

        if (!controller?.gameZone?.addToGameZone) {
            throw new TypeError(
                'SetControllerEffect requires a controller with a game zone.'
            );
        }

        return controller;
    }
    filterTarget(target, _params) {
        return Boolean(target?.isCard) &&
            super.filterTarget.apply(this, arguments);
    }
    async execute(params) {
        const card = this.selectedTarget;
        const controller = this.getController(params);

        if (!card || card.controller === controller) {
            return;
        }

        const oldZone = [
            card.scenarioZone,
            card.controller?.gameZone,
        ].find(zone => zone?.cards?.includes(card));
        if (!oldZone) {
            throw new Error(
                `No se encontró la zona de juego actual de "${card.name}".`
            );
        }

        oldZone.remove(card);
        controller.gameZone.addToGameZone(card);
        card.controller = controller;
        card.scenarioZone = controller.scenarioZone;
        await card.initTriggers(params);
        await oldZone.refresh();
        await controller.gameZone.refresh();
    }
}
