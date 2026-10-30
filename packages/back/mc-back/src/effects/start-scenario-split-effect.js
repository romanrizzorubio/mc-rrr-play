import {TARGET_PLAYER} from 'mc-shared';

import {DealEncounterEffect} from './deal-encounter-effect.js';
import {Effect} from './effect.js';

export class StartScenarioSplitEffect extends Effect {
    constructor({stage = 3, villainStage = 2}) {
        super(arguments[0]);

        this.stage = stage;
        this.villainStage = villainStage;
    }
    async execute() {
        const {match, stage, villainStage} = this;
        const {scenario, players, initialPlayer} = match;
        const firstPlayerIndex = players.indexOf(initialPlayer);
        const orderedPlayers = firstPlayerIndex < 0 ?
            players.slice() :
            players.slice(firstPlayerIndex).concat(players.slice(0, firstPlayerIndex));
        const activePlayers = orderedPlayers.filter(player =>
            !player.defeated);
        const availableSchemes = scenario.allMainSchemes.filter(scheme =>
            scheme.sides?.some(side => side.stage === stage) &&
            !scenario.usedMainSchemes.has(scheme));

        if (availableSchemes.length < activePlayers.length) {
            throw new Error(
                `No hay suficientes etapas ${stage} del Plan principal para separar a los jugadores.`
            );
        }

        for (const player of activePlayers) {
            const randomIndex = Math.floor(Math.random() * availableSchemes.length);
            const [scheme] = availableSchemes.splice(randomIndex, 1);
            const sideA = scheme.sides.find(side =>
                side.stage === stage && side.isMainScheme && side.final === undefined);
            const villainName = sideA?.content?.villainName;
            if (!villainName) {
                throw new Error(
                    `La etapa ${stage} del Plan principal no especifica el nombre de su Villano.`
                );
            }

            const zone = scenario.createZone();
            zone.addPlayer(player);
            await scenario.advanceMainScheme(zone, stage, player, scheme);
            await scenario.addVillainToZone({
                zone,
                name: villainName,
                stage: villainStage,
                player,
            });

            const dealEncounterEffect = new DealEncounterEffect({
                target: TARGET_PLAYER,
                count: 1,
                match,
            });
            await dealEncounterEffect.runEffect({
                player,
                selectedTarget: player,
            });
        }

        availableSchemes.forEach(scheme => {
            scenario.usedMainSchemes.add(scheme);
            match.removeCard(scheme);
        });
    }
}
