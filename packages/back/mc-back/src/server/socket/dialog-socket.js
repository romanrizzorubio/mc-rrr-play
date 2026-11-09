import {EVENTS} from 'mc-endpoints';

const createMatchUnavailableError = name => {
    const error = new Error(`La partida "${name}" ya no está disponible.`);
    error.statusCode = 409;

    return error;
};

export class DialogSocket {
    constructor(mcSocket) {
        this.mcSocket = mcSocket;
        this.pending = new Map();
        this.requestSequence = 0;
    }
    openDialog(match, params) {
        if (!this.mcSocket.isMatchAvailable(match)) {
            return Promise.reject(createMatchUnavailableError(match.name));
        }

        const requestId = `${match.name}:${++this.requestSequence}`;
        const targetPlayerIdentifier = typeof params.targetPlayer === 'string' ?
            params.targetPlayer :
            params.targetPlayer?.id ??
            params.targetPlayer?.userId ??
            params.targetPlayer?.name;
        if (params.showToAll && !targetPlayerIdentifier) {
            return Promise.reject(new Error(
                'Un diálogo público necesita un jugador responsable.',
            ));
        }
        const targetPlayer = targetPlayerIdentifier ?
            match.getPlayer(targetPlayerIdentifier) :
            undefined;
        if (targetPlayerIdentifier && !targetPlayer) {
            return Promise.reject(new Error(
                'No se encontró al jugador destinatario del diálogo.',
            ));
        }
        const targetPlayerName = params.targetPlayerName ||
            targetPlayer?.name ||
            targetPlayerIdentifier;
        const targetHeroName = targetPlayer?.superhero?.mainName ||
            targetPlayer?.superhero?.name;
        const dialog = {
            ...params,
            ...(targetPlayerIdentifier ? {
                targetPlayer: targetPlayer?.id || targetPlayerIdentifier,
                targetPlayerName,
                targetUserId: targetPlayer.userId,
                ...(targetHeroName ? {targetHeroName} : {}),
            } : {}),
            match: match.name,
            requestId,
        };

        return new Promise((resolve, reject) => {
            this.pending.set(requestId, {
                match,
                matchName: match.name,
                dialog,
                targetPlayerName,
                targetUserId: targetPlayer?.userId,
                resolve,
                reject,
            });

            try {
                this.mcSocket.send(match.name, EVENTS.DIALOG.OPEN, dialog);
            } catch (error) {
                this.pending.delete(requestId);
                reject(error);
            }
        });
    }
    respond(matchName, params, userId) {
        const {requestId, response} = params ?? {};
        const pending = this.pending.get(requestId);

        if (!pending || pending.matchName !== matchName) {
            return false;
        }
        if (pending.targetPlayerName &&
            (!pending.targetUserId || pending.targetUserId !== userId)) {
            return false;
        }

        this.mcSocket.send(matchName, EVENTS.DIALOG.COMPLETE, {requestId});
        this.pending.delete(requestId);
        pending.resolve(response);

        return true;
    }
    resendPending(matchName, socket) {
        for (const pending of this.pending.values()) {
            if (pending.matchName === matchName &&
                this.mcSocket.isMatchAvailable(pending.match)) {
                socket.emit(EVENTS.DIALOG.OPEN, pending.dialog);
            }
        }
    }
    hasPending(matchName) {
        return [...this.pending.values()].some(pending =>
            pending.matchName === matchName);
    }
    clearPending(matchName) {
        let cleared = 0;

        for (const [requestId, pending] of this.pending) {
            if (pending.matchName === matchName) {
                this.mcSocket.send(matchName, EVENTS.DIALOG.COMPLETE, {requestId});
                this.pending.delete(requestId);
                const error = createMatchUnavailableError(matchName);
                error.message = `La partida "${matchName}" se ha eliminado mientras esperaba una respuesta.`;
                pending.reject(error);
                cleared++;
            }
        }

        return cleared;
    }
}