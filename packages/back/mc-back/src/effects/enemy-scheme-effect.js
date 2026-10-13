import {TARGET_MAIN_SCHEME} from 'mc-shared';

import {Calc} from '../engine/calc.js';
import {EnemyActivationEffect} from './enemy-activation-effect.js';
import {GetSchemeEffect} from './get-scheme-effect.js';
import {PlaceThreatEffect} from './place-threat-effect.js';

export class EnemySchemeEffect extends EnemyActivationEffect {
    constructor(params = {}) {
        super({
            ...params,
            isScheme: true,
            target: params.target ?? TARGET_MAIN_SCHEME,
        });

        this.schemeModifierCalc = params.schemeModifierCalc;
        this.modifyScheme = 0;
        this._schemeModifierResolved = false;
        this.preventThreat = 0;
        this.threatPlaced = 0;
    }
    resetForResolution() {
        super.resetForResolution();
        this.modifyScheme = 0;
        this._schemeModifierResolved = false;
        this.preventThreat = 0;
        this.threatPlaced = 0;
    }
    getTargetDialog({player} = {}) {
        const target = player?.superhero?.currentSide;

        if (!target) {
            throw new TypeError(
                'EnemySchemeEffect requires a player with a superhero side for its activation dialog.'
            );
        }

        return target;
    }
    getBoostTarget({player} = {}) {
        if (!player) {
            throw new TypeError(
                'EnemySchemeEffect requires a player for boost resolution.'
            );
        }

        return player;
    }
    async resolveStatus(params) {
        await this.showActivationSkippedDialog(
            'confused',
            `${this.character.name} estaba confundido y no ejecuta el plan.`
        );

        return super.resolveStatus(params);
    }
    async getSchemeValue(params) {
        const {character} = this;

        if (this.schemeModifierCalc && !this._schemeModifierResolved) {
            const modifier = await new Calc(this.schemeModifierCalc).calculate({
                ...params,
                match: params.match ?? this.match,
                effect: this,
            });
            if (!Number.isFinite(modifier)) {
                throw new TypeError(
                    'EnemySchemeEffect requires a finite scheme modifier.'
                );
            }

            this.modifyScheme += modifier;
            this._schemeModifierResolved = true;
        }

        const getSchemeEffect = new GetSchemeEffect({
            selectedTarget: character,
            match: this.match,
        });

        await getSchemeEffect.runEffect(params);

        return getSchemeEffect.scheme + this.modifyScheme;
    }
    async getActivationCharacterData(params) {
        const scheme = await this.getSchemeValue(params);

        return {
            ...this.character.toObj(params),
            scheme,
        };
    }
    getTitleDialog() {
        const {character} = this;

        return `${character.name} ejecuta el Plan`;
    }
    async execute(params) {
        const {preventThreat} = this;

        await this.dealBoostCards(params);
        await this.showBoostCards();
        const boost = await this.resolveBoostCards(params);
        const schValue = await this.getSchemeValue(params);
        let threat = schValue + boost - preventThreat;
        if (threat < 0) {
            threat = 0;
        }

        const placeThreatEffect = new PlaceThreatEffect({
            threat,
            isScheme: true,
            match: this.match,
            selectedTarget: this.selectedTarget,
            activation: this.activation,
            ability: this.ability,
        });

        await placeThreatEffect.runEffect(params);
        this.threatPlaced = placeThreatEffect.resolved ?
            placeThreatEffect.threat :
            0;
    }
}