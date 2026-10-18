import {
    TARGET_MAIN_SCHEME,
    TRIGGER_CHARACTER_SCHEMES,
} from 'mc-shared';

import {Calc} from '../engine/calc.js';
import {EnemyActivationEffect} from './enemy-activation-effect.js';
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
    getSchemePlayer(params = {}) {
        const character = this.character;
        const engagedPlayer = character?.isMinion &&
            character.engaged?.isPlayer ?
            character.engaged :
            undefined;
        const player = engagedPlayer ??
            (params.player?.isPlayer ? params.player : undefined) ??
            this.match?.initialPlayer ??
            params.player;

        if (!player) {
            throw new TypeError(
                'EnemySchemeEffect requires a player for scheme resolution.'
            );
        }

        return player;
    }
    resolveParams(params = {}) {
        return {
            ...params,
            player: this.getSchemePlayer(params),
        };
    }
    getTargetDialog({player} = {}) {
        const schemePlayer = this.getSchemePlayer({player});
        const target = schemePlayer?.superhero?.currentSide;

        if (!target) {
            throw new TypeError(
                'EnemySchemeEffect requires a player with a superhero side for its activation dialog.'
            );
        }

        return target;
    }
    getTriggersParams(params) {
        return {
            ...super.getTriggersParams(params),
            player: this.getSchemePlayer(params),
        };
    }
    getBoostTarget(params = {}) {
        return this.getSchemePlayer(params);
    }
    getTriggersEnds(params) {
        const triggers = super.getTriggersEnds(params);

        return this.character?.isCharacter ?
            triggers.concat([TRIGGER_CHARACTER_SCHEMES]) :
            triggers;
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
        const schemeParams = this.resolveParams(params);

        if (this.schemeModifierCalc && !this._schemeModifierResolved) {
            const modifier = await new Calc(this.schemeModifierCalc).calculate({
                ...schemeParams,
                match: schemeParams.match ?? this.match,
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

        return await character.getSchemeValue(schemeParams) + this.modifyScheme;
    }
    async getActivationCharacterData(params) {
        const schemeParams = this.resolveParams(params);
        const scheme = await this.getSchemeValue(schemeParams);

        return this.getCharacterDialogData(
            this.character,
            schemeParams,
            {scheme}
        );
    }
    getTitleDialog() {
        const {character} = this;

        return `${character.name} ejecuta el Plan`;
    }
    async execute(params) {
        const schemeParams = this.resolveParams(params);
        const {preventThreat} = this;

        await this.dealBoostCards(schemeParams);
        await this.showBoostCards();
        const boost = await this.resolveBoostCards(schemeParams);
        const schValue = await this.getSchemeValue(schemeParams);
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

        await placeThreatEffect.runEffect(schemeParams);
        this.threatPlaced = placeThreatEffect.resolved ?
            placeThreatEffect.threat :
            0;
    }
}