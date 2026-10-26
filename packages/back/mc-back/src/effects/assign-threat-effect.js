import {
    DIALOG_ASSIGN,
    TARGET_ALL_SCHEMES,
} from 'mc-shared';

import {RemoveThreatEffect} from './remove-threat-effect.js';
import {Effect} from './effect.js';

export class AssignThreatEffect extends Effect {
    constructor({
        ignoreCrisis = false,
        threat,
    }) {
        super(arguments[0]);

        this.baseThreat = threat;
        this.threat = threat;
        this.ignoreCrisis = ignoreCrisis;
    }
    filterTarget(card, params) {
        return card.canRemoveThreat({ignoreCrisis: this.ignoreCrisis}) &&
            super.filterTarget(card, params);
    }
    static validateAssignment(assigned, selectedTargets, threat) {
        if (!assigned ||
            typeof assigned !== 'object' ||
            Array.isArray(assigned) ||
            Object.keys(assigned).length !== selectedTargets.length) {
            throw new Error('La distribución de amenaza no es válida.');
        }

        const assignments = selectedTargets.map(scheme => {
            const amount = assigned[scheme.id];
            const capacity = Math.min(
                threat,
                Math.max(0, Number(scheme.threat) || 0)
            );
            if (!Number.isInteger(amount) || amount < 0 || amount > capacity) {
                throw new Error('La distribución de amenaza no es válida.');
            }

            return {amount, scheme};
        });
        const assignedTotal = assignments.reduce((total, {amount}) =>
            total + amount, 0);
        const maximum = Math.min(
            threat,
            selectedTargets.reduce((total, scheme) =>
                total + Math.max(0, Number(scheme.threat) || 0), 0)
        );
        if (assignedTotal !== maximum ||
            assignments.some(({scheme}) =>
                !Object.hasOwn(assigned, scheme.id))) {
            throw new Error('La distribución de amenaza no es válida.');
        }

        return assignments;
    }
    async execute(params) {
        const selectedTargets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget :
            this.selectedTarget ?
                [this.selectedTarget] :
                [];
        if (!selectedTargets.length) {
            return;
        }

        const threat = this.paramsCalc ?
            await this.calculate(params) :
            this.baseThreat;
        if (threat <= 0) {
            return;
        }

        this.threat = threat;
        const removeThreat = (scheme, assignedThreat) => {
            if (!assignedThreat) {
                return;
            }

            const effect = new RemoveThreatEffect({
                ability: this.ability,
                ignoreCrisis: this.ignoreCrisis,
                match: this.match,
                selectedTarget: scheme,
                target: TARGET_ALL_SCHEMES,
                threat: assignedThreat,
            });

            return effect.runEffect(params);
        };

        if (selectedTargets.length === 1) {
            const [scheme] = selectedTargets;
            const assignedThreat = Math.min(
                threat,
                Math.max(0, Number(scheme.threat) || 0)
            );

            return removeThreat(scheme, assignedThreat);
        }

        const {player} = params;
        const cards = selectedTargets.map(scheme => ({
            ...scheme.toObj(params),
            threat: Math.max(0, Number(scheme.threat) || 0),
        }));
        const initialTargetId = selectedTargets.find(({id}) =>
            id === params.playCardEffect?.targetId
        )?.id;
        const response = await this.openDialog({
            dialogType: DIALOG_ASSIGN,
            title: `Quita un total de ${this.threat} de Amenaza`,
            hand: player.hand.cards.map(card => card.toObj(params)),
            data: {
                assignInitially: true,
                autoAssignRemainderToSingleTarget: true,
                count: this.threat,
                field: 'threat',
                initialTargetId,
                preserveRemainderOnDecrease: true,
                transferIncreaseFromMostAssigned: true,
                cards,
            },
        });
        const assignments = AssignThreatEffect.validateAssignment(
            response?.assigned,
            selectedTargets,
            this.threat,
        );

        return this.promisesSequential(assignments, ({amount, scheme}) =>
            removeThreat(scheme, amount));
    }
}
